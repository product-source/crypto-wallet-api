import { Notification, NotificationDocument } from "./schema/notification.schema";
import { Model } from "mongoose";
import { MerchantsService } from "src/merchants/merchants.service";
import { SendNotificationDto } from "./dto/notification.dto";
import { MerchantDocument } from "src/merchants/schema/merchant.schema";
export declare class NotificationService {
    private readonly notificationModel;
    private readonly merchantModel;
    private readonly merchantService;
    constructor(notificationModel: Model<NotificationDocument>, merchantModel: Model<MerchantDocument>, merchantService: MerchantsService);
    getAuthNotifications(user: any, query: any): Promise<{
        succes: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        notifications: (import("mongoose").Document<unknown, {}, NotificationDocument, {}, {}> & Notification & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    notificationList(query: any): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        notifications: any[];
    }>;
    deleteNotification(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendNotification(dto: SendNotificationDto): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, NotificationDocument, {}, {}> & Notification & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    } | {
        success: boolean;
        message: string;
        data: import("mongoose").MergeType<import("mongoose").Document<unknown, {}, NotificationDocument, {}, {}> & Notification & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, Omit<{
            merchantId: string;
            message: string;
            notificationType: string;
        }, "_id">>[];
    }>;
}
