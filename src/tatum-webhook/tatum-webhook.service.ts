import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  PaymentLink,
  PaymentLinkDocument,
} from "src/payment-link/schema/payment-link.schema";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import {
  PaymentStatus,
  WithdrawPaymentStatus,
} from "src/payment-link/schema/payment.enum";
import { WebhookService } from "src/webhook/webhook.service";
import { WebhookEvent } from "src/webhook/schema/webhook-log.schema";
import { NATIVE, TRON_CHAIN_ID } from "src/constants";
import { getTronBalance, getTRC20Balance } from "src/helpers/tron.helper";
import { EncryptionService } from "src/utils/encryption.service";
import * as crypto from "crypto";
import { ConfigService } from "src/config/config.service";

@Injectable()
export class TatumWebhookService {
  private readonly logger = new Logger(TatumWebhookService.name);

  constructor(
    @InjectModel(PaymentLink.name)
    private readonly paymentLinkModel: Model<PaymentLinkDocument>,
    @InjectModel(Apps.name)
    private readonly appsModel: Model<AppsDocument>,
    private readonly webhookService: WebhookService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Verify the HMAC signature from Tatum webhook.
   */
  verifyHmacSignature(body: any, signature: string): boolean {
    try {
      const secret = ConfigService.keys.TATUM_WEBHOOK_HMAC_SECRET;
      if (!secret || !signature) {
        return true; // Accept all if HMAC not configured (dev mode)
      }
      const expectedSignature = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(body))
        .digest("hex");
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error("HMAC verification error:", error.message);
      return false;
    }
  }

  /**
   * Handle Tatum ADDRESS_EVENT webhook for Tron addresses.
   *
   * Tatum V4 webhook payload structure:
   * {
   *   "subscriptionType": "ADDRESS_EVENT",
   *   "address": "TXXXXXXX",
   *   "counterAddress": "TYYYYYYY",
   *   "amount": "42.769716",
   *   "asset": "TRX",
   *   "blockNumber": 12345,
   *   "txId": "abc123...",
   *   "type": "native" | "trc20",
   *   "chain": "TRON"
   * }
   */
  async handleTronWebhook(body: any): Promise<{ status: string }> {
    try {
      // Log FULL raw body for debugging (remove after confirmed working)
      this.logger.log(
        `[Tatum Webhook] RAW BODY: ${JSON.stringify(body)}`
      );

      // Tatum may send data at root level OR nested in 'data' field
      const payload = body?.data || body;

      // Extract fields - handle various Tatum payload formats
      const address = payload?.address || payload?.Address || body?.address;
      const txId = payload?.txId || payload?.transactionId || payload?.txID || body?.txId;
      const amount = payload?.amount || payload?.Amount || body?.amount;
      const counterAddress = payload?.counterAddress || payload?.from || body?.counterAddress;
      const asset = payload?.asset || payload?.tokenAddress || body?.asset;
      const blockNumber = payload?.blockNumber || payload?.block || body?.blockNumber;

      this.logger.log(
        `[Tatum Webhook] Parsed -> address: ${address}, txId: ${txId}, amount: ${amount}, asset: ${asset}, block: ${blockNumber}`
      );

      if (!address || !txId) {
        this.logger.warn("[Tatum Webhook] Missing address or txId. Ignoring.");
        return { status: "ignored" };
      }

      // Find PENDING payment link for this address
      const paymentLink = await this.paymentLinkModel.findOne({
        toAddress: address,
        status: PaymentStatus.PENDING,
        chainId: TRON_CHAIN_ID,
      });

      if (!paymentLink) {
        this.logger.log(
          `[Tatum Webhook] No PENDING payment link found for address: ${address}. May be already processed.`
        );
        return { status: "no_matching_link" };
      }

      // Get actual on-chain balance (more reliable than webhook amount alone)
      // Wait 5 seconds for TronGrid to sync — Tatum notifies faster than TronGrid updates
      await new Promise((resolve) => setTimeout(resolve, 5000));

      let actualBalance = 0;

      if (paymentLink.tokenAddress === NATIVE) {
        // Native TRX payment
        actualBalance = await getTronBalance(address);
      } else {
        // TRC20 token payment (USDT, USDC, etc.)
        try {
          const decryptedKey = this.encryptionService.decryptData(
            paymentLink.privateKey
          );
          const tokenInfo = {
            address: paymentLink.tokenAddress,
            _doc: { address: paymentLink.tokenAddress },
          };
          const balances = await getTRC20Balance([tokenInfo], decryptedKey);
          if (balances && balances.length > 0) {
            actualBalance = parseFloat(balances[0].balance || "0");
          }
        } catch (balErr) {
          this.logger.error(
            `[Tatum Webhook] Error fetching TRC20 balance: ${balErr.message}`
          );
          actualBalance = parseFloat(amount || "0");
        }
      }

      // If on-chain balance is still 0, trust the webhook amount from Tatum
      if (actualBalance <= 0 && parseFloat(amount || "0") > 0) {
        this.logger.log(
          `[Tatum Webhook] On-chain balance still 0 for ${address}, using webhook amount: ${amount}`
        );
        actualBalance = parseFloat(amount);
      }

      if (actualBalance <= 0) {
        this.logger.log(
          `[Tatum Webhook] Balance is 0 for ${address}. Fallback cron will catch it.`
        );
        return { status: "balance_zero_will_retry" };
      }

      // Check if amount meets requirement (with tolerance)
      const app = await this.appsModel.findById(paymentLink.appId);
      const toleranceMargin = app?.toleranceMargin || 0;
      const requiredAmount = parseFloat(paymentLink.amount);
      const minRequired = requiredAmount * (1 - toleranceMargin / 100);

      const updateData: any = {
        recivedAmount: actualBalance,
        hash: txId,
        fromAddress: counterAddress || "",
      };

      if (actualBalance >= minRequired) {
        updateData.status = PaymentStatus.PARTIALLY_SUCCESS;
        this.logger.log(
          `[Tatum Webhook] ✅ Payment CONFIRMED for ${address}. Received: ${actualBalance}, Required: ${minRequired}`
        );
      } else {
        updateData.status = PaymentStatus.PENDING;
        this.logger.log(
          `[Tatum Webhook] ⏳ Partial payment for ${address}. Received: ${actualBalance}, Required: ${minRequired}`
        );
      }

      const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
        { _id: paymentLink._id },
        { $set: updateData },
        { new: true }
      );

      // If confirmed, notify merchant
      if (
        updatedLink &&
        updateData.status === PaymentStatus.PARTIALLY_SUCCESS
      ) {
        await this.webhookService.sendWebhook(
          updatedLink.appId.toString(),
          updatedLink._id.toString(),
          WebhookEvent.PAYMENT_CONFIRMED,
          {
            ...updatedLink.toObject(),
            status: PaymentStatus.PARTIALLY_SUCCESS,
            hash: txId,
            fromAddress: counterAddress,
            recivedAmount: actualBalance,
          }
        );
      }

      return { status: "ok" };
    } catch (error) {
      this.logger.error(
        `[Tatum Webhook] Error processing: ${error.message}`,
        error.stack
      );
      return { status: "error" };
    }
  }
}
