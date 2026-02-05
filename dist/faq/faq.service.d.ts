import { Faq, FaqDocument } from "./schema/faq.schema";
import { AddFaqDto, UpdateFaqDto } from "./dto/faq.dto";
import { Model } from "mongoose";
export declare class FaqService {
    private readonly faqModel;
    constructor(faqModel: Model<FaqDocument>);
    ensureDefaultFaqExist(): Promise<void>;
    addFaq(dto: AddFaqDto): Promise<{
        message: string;
    }>;
    faqList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, FaqDocument, {}, {}> & Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewFaq(id: any): Promise<{
        message: string;
        faq: import("mongoose").Document<unknown, {}, FaqDocument, {}, {}> & Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateFaq(dto: UpdateFaqDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, FaqDocument, {}, {}> & Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    deleteFaq(id: any): Promise<{
        message: string;
    }>;
}
