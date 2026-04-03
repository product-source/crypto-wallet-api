import { InquiryService } from "./inquiry.service";
import { AddInquiryDto, CreateInquiryDto } from "./dto/inquiry.dto";
export declare class InquiryController {
    private readonly inquiryService;
    constructor(inquiryService: InquiryService);
    addInquiry(dto: AddInquiryDto): Promise<{
        message: string;
    }>;
    usersList(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/inquiry.schema").InquiryDocument, {}, {}> & import("./schema/inquiry.schema").Inquiry & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewInquiry(query: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, import("./schema/inquiry.schema").InquiryDocument, {}, {}> & import("./schema/inquiry.schema").Inquiry & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    createAccount(dto: CreateInquiryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("../merchants/schema/merchant.schema").MerchantDocument, {}, {}> & import("../merchants/schema/merchant.schema").Merchant & Document & {
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
