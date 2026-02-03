import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { Notification, NotificationSchema } from "./schema/notification.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { MerchantsModule } from "src/merchants/merchants.module";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";

@Module({
  imports: [
    MerchantsModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Merchant.name, schema: MerchantSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
