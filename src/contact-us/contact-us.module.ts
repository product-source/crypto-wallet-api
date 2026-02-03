import { Module } from "@nestjs/common";
import { ContactUsService } from "./contact-us.service";
import { ContactUsController } from "./contact-us.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ContactUs, ContactUsSchema } from "./schema/contact-us.schema";
import { EmailModule } from "src/emails/email.module";
import { Pricing, PricingSchema } from "src/pricing/schema/pricing.schema";

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Pricing.name, schema: PricingSchema },
    ]),
  ],
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
