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
   * Returns true if the signature is valid or if HMAC is not configured.
   */
  verifyHmacSignature(body: any, signature: string): boolean {
    try {
      const secret = ConfigService.keys.TATUM_WEBHOOK_HMAC_SECRET;
      if (!secret || !signature) {
        // If no HMAC configured, accept all (for development)
        return true;
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
   * This is called when any transaction hits a subscribed Tron wallet address.
   */
  async handleTronWebhook(body: any): Promise<{ status: string }> {
    try {
      const {
        address,       // The monitored Tron address
        txId,          // Transaction hash
        amount,        // Amount in the native unit
        counterAddress, // The sender address
        asset,         // e.g., "TRX" or token contract address
        type,          // "native" or "trc20"
        blockNumber,
      } = body;

      this.logger.log(
        `[Tatum Webhook] Received event for address: ${address}, txId: ${txId}, amount: ${amount}, asset: ${asset}`
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
          `[Tatum Webhook] No PENDING payment link found for address: ${address}. May be already processed or not a payment wallet.`
        );
        return { status: "no_matching_link" };
      }

      // Get the actual current balance to determine received amount
      // (more reliable than relying solely on webhook amount)
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
          // Use the webhook amount as fallback
          actualBalance = parseFloat(amount || "0");
        }
      }

      if (actualBalance <= 0) {
        this.logger.log(
          `[Tatum Webhook] Balance is 0 for ${address}. Webhook may have arrived before on-chain confirmation. Will be caught by fallback cron.`
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
        // Partial payment — update the received amount but keep PENDING
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

      // If payment is now confirmed, trigger webhook to merchant
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
        `[Tatum Webhook] Error processing webhook: ${error.message}`,
        error.stack
      );
      return { status: "error" };
    }
  }
}
