import { ContactUsService } from "./contact-us.service";
import { AddContactDto, UpdateContactDto } from "./dto/contact-us.dto";
export declare class ContactUsController {
    private readonly contactUsService;
    constructor(contactUsService: ContactUsService);
    addContact(dto: AddContactDto, file: any): Promise<{
        message: string;
    }>;
    contactList(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/contact-us.schema").ContactUsDocument, {}, {}> & import("./schema/contact-us.schema").ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewContact(query: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, import("./schema/contact-us.schema").ContactUsDocument, {}, {}> & import("./schema/contact-us.schema").ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
        pricingData: any;
    }>;
    updateContactt(dto: UpdateContactDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/contact-us.schema").ContactUsDocument, {}, {}> & import("./schema/contact-us.schema").ContactUs & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
