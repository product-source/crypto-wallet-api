import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type PricingDocument = Pricing & Document;

@Schema({ timestamps: true })
export class Pricing {
  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop()
  title: string;

  @Prop()
  pricing: string;

  @Prop()
  description: string;
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
