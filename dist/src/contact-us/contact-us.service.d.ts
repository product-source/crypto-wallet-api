import { Model } from "mongoose";
import { ContactUs, ContactUsDocument } from "./schema/contact-us.schema";
import { AddContactDto, UpdateContactDto } from "./dto/contact-us.dto";
import { EmailService } from "src/emails/email.service";
import { PricingDocument } from "src/pricing/schema/pricing.schema";
export declare class ContactUsService {
    private readonly contactModel;
    private readonly pricingModel;
    private readonly emailService;
    constructor(contactModel: Model<ContactUsDocument>, pricingModel: Model<PricingDocument>, emailService: EmailService);
    addContact(dto: AddContactDto, file: any): Promise<{
        message: string;
    }>;
    getContacts(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, ContactUsDocument, {}, {}> & ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewContact(id: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, ContactUsDocument, {}, {}> & ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
        pricingData: any;
    }>;
    updateConatact(dto: UpdateContactDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, ContactUsDocument, {}, {}> & ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
