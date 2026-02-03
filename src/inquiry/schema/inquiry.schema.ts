import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type InquiryDocument = Inquiry & Document;

@Schema({ timestamps: true })
export class Inquiry {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  platformName: string;

  @Prop({ required: true })
  platformCategory: string;

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isAccountCreated: boolean;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);
