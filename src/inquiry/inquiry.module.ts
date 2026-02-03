import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "src/emails/email.module";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";
import { InquiryController } from "./inquiry.controller";
import { InquiryService } from "./inquiry.service";
import { Inquiry, InquirySchema } from "./schema/inquiry.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inquiry.name, schema: InquirySchema },
      { name: Merchant.name, schema: MerchantSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),

    EmailModule,
  ],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
