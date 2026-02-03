import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WebhookService } from "./webhook.service";
import { WebhookLog, WebhookLogSchema } from "./schema/webhook-log.schema";
import { Apps, AppsSchema } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookLog.name, schema: WebhookLogSchema },
      { name: Apps.name, schema: AppsSchema },
    ]),
  ],
  providers: [WebhookService, EncryptionService],
  exports: [WebhookService],
})
export class WebhookModule {}
