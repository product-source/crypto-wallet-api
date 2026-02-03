import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import { Merchant } from "src/merchants/schema/merchant.schema";

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Merchant.name,
    required: true,
  })
  merchantId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
    required: true,
  })
  appsId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  fiatAmount: string;

  @Prop({ required: true })
  cryptoAmount: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: "" })
  productId: string;

  @Prop({ default: "" })
  productName: string;

  @Prop({ default: "" })
  remarks: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
