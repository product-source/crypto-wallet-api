import { Controller, Post, Body, Headers, Logger } from "@nestjs/common";
import { TatumWebhookService } from "./tatum-webhook.service";

@Controller("tatum-webhook")
export class TatumWebhookController {
  private readonly logger = new Logger(TatumWebhookController.name);

  constructor(private readonly tatumWebhookService: TatumWebhookService) {}

  /**
   * POST /tatum-webhook/tron
   *
   * Receives Tatum ADDRESS_EVENT notifications for Tron wallets.
   * This endpoint is called by Tatum when a transaction arrives
   * at a subscribed Tron address. No authentication guard — Tatum
   * needs to call this freely. Security is via HMAC signature verification.
   */
  @Post("tron")
  async handleTronWebhook(
    @Body() body: any,
    @Headers("x-payload-hash") signatureHeader: string
  ) {
    this.logger.log(`[Tatum Webhook] Incoming Tron notification`);

    // Verify HMAC signature
    const isValid = this.tatumWebhookService.verifyHmacSignature(
      body,
      signatureHeader
    );

    if (!isValid) {
      this.logger.warn("[Tatum Webhook] Invalid HMAC signature. Rejecting.");
      return { status: "rejected", reason: "invalid_signature" };
    }

    // Process the webhook
    return this.tatumWebhookService.handleTronWebhook(body);
  }
}
