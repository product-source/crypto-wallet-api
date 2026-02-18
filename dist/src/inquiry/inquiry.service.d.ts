import { Model } from "mongoose";
import { EmailService } from "src/emails/email.service";
import { AddInquiryDto, CreateInquiryDto } from "./dto/inquiry.dto";
import { Inquiry, InquiryDocument } from "./schema/inquiry.schema";
import { Merchant, MerchantDocument } from "src/merchants/schema/merchant.schema";
import { NotificationDocument } from "src/notification/schema/notification.schema";
export declare class InquiryService {
    private readonly inquiryModel;
    private readonly merchantModel;
    private readonly notificationModel;
    private readonly emailService;
    constructor(inquiryModel: Model<InquiryDocument>, merchantModel: Model<MerchantDocument>, notificationModel: Model<NotificationDocument>, emailService: EmailService);
    addInquiry(dto: AddInquiryDto): Promise<{
        message: string;
    }>;
    getUsers(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, InquiryDocument, {}, {}> & Inquiry & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewInquiry(id: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, InquiryDocument, {}, {}> & Inquiry & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    createAccount(dto: CreateInquiryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    inquiryCount(): Promise<{
        message: string;
        count: number;
    }>;
}
