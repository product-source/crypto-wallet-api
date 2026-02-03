import { Module } from "@nestjs/common";
import { MerchantsService } from "./merchants.service";
import { MerchantsController } from "./merchants.controller";
import { Merchant, MerchantSchema } from "./schema/merchant.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { HashService } from "src/admin/hash.service";
import { EmailModule } from "src/emails/email.module";
import { EncryptionService } from "src/utils/encryption.service";
import { Apps, AppsSchema } from "src/apps/schema/apps.schema";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      { name: Merchant.name, schema: MerchantSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Apps.name, schema: AppsSchema },
    ]),

    // MongooseModule.forFeature([{ name: Apps.name, schema: AppsSchema }]),
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService, HashService, EncryptionService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
