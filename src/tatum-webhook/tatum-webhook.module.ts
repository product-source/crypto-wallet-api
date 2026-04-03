import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TatumWebhookController } from "./tatum-webhook.controller";
import { TatumWebhookService } from "./tatum-webhook.service";
import { PaymentLinkSchema } from "src/payment-link/schema/payment-link.schema";
import { AppsSchema } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { WebhookModule } from "src/webhook/webhook.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "PaymentLink", schema: PaymentLinkSchema },
      { name: "Apps", schema: AppsSchema },
    ]),
    WebhookModule,
  ],
  controllers: [TatumWebhookController],
  providers: [TatumWebhookService, EncryptionService],
  exports: [TatumWebhookService],
})
export class TatumWebhookModule {}
