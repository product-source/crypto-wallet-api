import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Pricing } from "src/pricing/schema/pricing.schema";

export type ContactUsDocument = ContactUs & Document;

@Schema({ timestamps: true })
export class ContactUs {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  image: string;

  @Prop()
  adminReply: string;

  @Prop({ default: "PENDING" })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Pricing.name,
  })
  pricingId: mongoose.Types.ObjectId;
}

export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
