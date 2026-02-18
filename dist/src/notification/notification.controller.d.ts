import { NotificationService } from "./notification.service";
import { SendNotificationDto } from "./dto/notification.dto";
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    authNotifications(req: any, query: any): Promise<{
        succes: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        notifications: (import("mongoose").Document<unknown, {}, import("./schema/notification.schema").NotificationDocument, {}, {}> & import("./schema/notification.schema").Notification & Document & {
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
    sendNotification(dto: SendNotificationDto): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/notification.schema").NotificationDocument, {}, {}> & import("./schema/notification.schema").Notification & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    } | {
        success: boolean;
        message: string;
        data: import("mongoose").MergeType<import("mongoose").Document<unknown, {}, import("./schema/notification.schema").NotificationDocument, {}, {}> & import("./schema/notification.schema").Notification & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, Omit<{
            merchantId: string;
            message: string;
            notificationType: string;
        }, "_id">>[];
    }>;
    deleteNotification(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
