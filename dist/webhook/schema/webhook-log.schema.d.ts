import mongoose from "mongoose";
export type WebhookLogDocument = WebhookLog & Document;
export declare enum WebhookEvent {
    PAYMENT_INITIATED = "payment.initiated",
    PAYMENT_CONFIRMED = "payment.confirmed",
    PAYMENT_SUCCESS = "payment.success",
    PAYMENT_EXPIRED = "payment.expired",
    WITHDRAWAL_PENDING = "withdrawal.pending",
    WITHDRAWAL_AUTO_APPROVED = "withdrawal.auto_approved",
    WITHDRAWAL_APPROVED = "withdrawal.approved",
    WITHDRAWAL_PROCESSING = "withdrawal.processing",
    WITHDRAWAL_SUCCESS = "withdrawal.success",
    WITHDRAWAL_FAILED = "withdrawal.failed",
    WITHDRAWAL_DECLINED = "withdrawal.declined"
}
export declare enum WebhookStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}
export declare class WebhookLog {
    appId: mongoose.Types.ObjectId;
    paymentId: string;
    event: WebhookEvent;
    webhookUrl: string;
    payload: Record<string, any>;
    status: WebhookStatus;
    attempts: number;
    responseStatus: number;
    responseBody: string;
    errorMessage: string;
    nextRetryAt: Date;
}
export declare const WebhookLogSchema: mongoose.Schema<WebhookLog, mongoose.Model<WebhookLog, any, any, any, mongoose.Document<unknown, any, WebhookLog, any, {}> & WebhookLog & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, WebhookLog, mongoose.Document<unknown, {}, mongoose.FlatRecord<WebhookLog>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<WebhookLog> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
