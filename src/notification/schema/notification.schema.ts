import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Merchant } from "src/merchants/schema/merchant.schema";

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Merchant.name,
  })
  merchantId: mongoose.Types.ObjectId;

  @Prop()
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  notificationType: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
