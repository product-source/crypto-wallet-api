import mongoose from "mongoose";
export type NotificationDocument = Notification & Document;
export declare class Notification {
    merchantId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    isRead: boolean;
    notificationType: string;
}
export declare const NotificationSchema: mongoose.Schema<Notification, mongoose.Model<Notification, any, any, any, mongoose.Document<unknown, any, Notification, any, {}> & Notification & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Notification, mongoose.Document<unknown, {}, mongoose.FlatRecord<Notification>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Notification> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
