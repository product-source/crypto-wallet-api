import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";

export type WebhookLogDocument = WebhookLog & Document;

export enum WebhookEvent {
  PAYMENT_INITIATED = "payment.initiated",
  PAYMENT_CONFIRMED = "payment.confirmed",
  PAYMENT_SUCCESS = "payment.success",
  PAYMENT_EXPIRED = "payment.expired",
  // User Withdrawal Events
  WITHDRAWAL_PENDING = "withdrawal.pending",
  WITHDRAWAL_AUTO_APPROVED = "withdrawal.auto_approved",
  WITHDRAWAL_APPROVED = "withdrawal.approved",
  WITHDRAWAL_PROCESSING = "withdrawal.processing",
  WITHDRAWAL_SUCCESS = "withdrawal.success",
  WITHDRAWAL_FAILED = "withdrawal.failed",
  WITHDRAWAL_DECLINED = "withdrawal.declined",
}

export enum WebhookStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

@Schema({ timestamps: true })
export class WebhookLog {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
    required: true,
  })
  appId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  paymentId: string;

  @Prop({ required: true, enum: Object.values(WebhookEvent) })
  event: WebhookEvent;

  @Prop({ required: true })
  webhookUrl: string;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ default: WebhookStatus.PENDING, enum: Object.values(WebhookStatus) })
  status: WebhookStatus;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  responseStatus: number;

  @Prop()
  responseBody: string;

  @Prop()
  errorMessage: string;

  @Prop()
  nextRetryAt: Date;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);
