import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { WebhookLog, WebhookLogDocument, WebhookEvent, WebhookStatus } from "./schema/webhook-log.schema";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import axios from "axios";
import * as crypto from "crypto";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EncryptionService } from "src/utils/encryption.service";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_DELAYS = [0, 60000, 300000, 900000, 3600000]; // 0s, 1m, 5m, 15m, 1h

  constructor(
    @InjectModel(WebhookLog.name)
    private readonly webhookLogModel: Model<WebhookLogDocument>,
    @InjectModel(Apps.name)
    private readonly appsModel: Model<AppsDocument>,
    private readonly encryptionService: EncryptionService
  ) {}

  generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
  }

  async sendWebhook(
    appId: string,
    paymentId: string,
    event: WebhookEvent,
    paymentData: any
  ): Promise<void> {
    try {
      const app = await this.appsModel.findById(appId).select('+webhookSecret +SECRET_KEY');

      if (!app || !app.webhookUrl) {
        this.logger.debug(`No webhook URL configured for app ${appId}`);
        return;
      }

      const payload = {
        event,
        paymentId,
        orderId: paymentData.orderId || paymentData._id,
        amount: paymentData.amount || paymentData.recivedAmount,
        currency: paymentData.code || paymentData.currency,
        status: paymentData.status,
        timestamp: Date.now(),
        data: {
          hash: paymentData.hash,
          fromAddress: paymentData.fromAddress,
          toAddress: paymentData.toAddress,
          blockNumber: paymentData.block?.number || paymentData.blockNumber,
          chainId: paymentData.chainId,
          recivedAmount: paymentData.recivedAmount,
        },
      };

      // Decrypt the webhook secret before using it
      let webhookSecret: string;

      try {
        if (app.webhookSecret) {
          webhookSecret = this.encryptionService.decryptData(app.webhookSecret);
        } else if (app.SECRET_KEY) {
          webhookSecret = this.encryptionService.decryptData(app.SECRET_KEY);
        } else {
          this.logger.error(`No secret key found for app ${appId}`);
          return;
        }
      } catch (error) {
        this.logger.error(`Error decrypting webhook secret for app ${appId}: ${error.message}`);
        return;
      }
      
      const payloadString = JSON.stringify(payload);
      const signature = crypto.createHmac("sha256", webhookSecret).update(payloadString).digest("hex");

      const payloadWithSignature = {
        ...payload,
        signature: `sha256=${signature}`,
      };

      const webhookLog = await this.webhookLogModel.create({
        appId,
        paymentId,
        event,
        webhookUrl: app.webhookUrl,
        payload: payloadWithSignature,
        status: WebhookStatus.PENDING,
        attempts: 0,
      });

      await this.executeWebhook(webhookLog._id.toString());
    } catch (error) {
      this.logger.error(`Error preparing webhook: ${error.message}`);
    }
  }

  async executeWebhook(webhookLogId: string): Promise<void> {
    try {
      const webhookLog = await this.webhookLogModel.findById(webhookLogId);

      if (!webhookLog || webhookLog.status === WebhookStatus.SUCCESS) {
        return;
      }

      if (webhookLog.attempts >= this.MAX_RETRY_ATTEMPTS) {
        await this.webhookLogModel.updateOne(
          { _id: webhookLogId },
          {
            $set: {
              status: WebhookStatus.FAILED,
              errorMessage: "Max retry attempts reached",
            },
          }
        );
        this.logger.warn(`Webhook ${webhookLogId} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
        return;
      }

      const response = await axios.post(webhookLog.webhookUrl, webhookLog.payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": webhookLog.payload.signature,
          "X-Webhook-Event": webhookLog.event,
        },
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        await this.webhookLogModel.updateOne(
          { _id: webhookLogId },
          {
            $set: {
              status: WebhookStatus.SUCCESS,
              responseStatus: response.status,
              responseBody: JSON.stringify(response.data).substring(0, 1000),
            },
            $inc: { attempts: 1 },
          }
        );
        this.logger.log(`Webhook ${webhookLogId} delivered successfully`);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const webhookLog = await this.webhookLogModel.findById(webhookLogId);
      const nextAttempt = webhookLog.attempts + 1;
      const nextRetryAt = new Date(Date.now() + this.RETRY_DELAYS[nextAttempt] || 3600000);

      await this.webhookLogModel.updateOne(
        { _id: webhookLogId },
        {
          $set: {
            status: WebhookStatus.PENDING,
            errorMessage: error.message,
            responseStatus: error.response?.status,
            nextRetryAt,
          },
          $inc: { attempts: 1 },
        }
      );

      this.logger.warn(
        `Webhook ${webhookLogId} failed (attempt ${nextAttempt}/${this.MAX_RETRY_ATTEMPTS}): ${error.message}`
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailedWebhooks(): Promise<void> {
    try {
      const now = new Date();
      const failedWebhooks = await this.webhookLogModel.find({
        status: WebhookStatus.PENDING,
        attempts: { $lt: this.MAX_RETRY_ATTEMPTS },
        nextRetryAt: { $lte: now },
      });

      this.logger.debug(`Found ${failedWebhooks.length} webhooks to retry`);

      for (const webhook of failedWebhooks) {
        await this.executeWebhook(webhook._id.toString());
      }
    } catch (error) {
      this.logger.error(`Error in retry cron job: ${error.message}`);
    }
  }

  async getWebhookLogs(appId: string, query: any): Promise<any> {
    const { pageNo = 1, limitVal = 20, status, event } = query;
    const page = parseInt(pageNo);
    const limit = parseInt(limitVal);
    const skip = (page - 1) * limit;

    const filter: any = { appId };
    if (status) filter.status = status;
    if (event) filter.event = event;

    const [logs, total]: [any[], number] = await Promise.all([
      this.webhookLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.webhookLogModel.countDocuments(filter),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
