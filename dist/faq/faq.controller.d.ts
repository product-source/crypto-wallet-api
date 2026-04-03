import { FaqService } from './faq.service';
import { AddFaqDto, UpdateFaqDto } from './dto/faq.dto';
export declare class FaqController {
    private readonly faqService;
    constructor(faqService: FaqService);
    addFaq(dto: AddFaqDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/faq.schema").FaqDocument, {}, {}> & import("./schema/faq.schema").Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewFaq(query: any): Promise<{
        message: string;
        faq: import("mongoose").Document<unknown, {}, import("./schema/faq.schema").FaqDocument, {}, {}> & import("./schema/faq.schema").Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateFaq(dto: UpdateFaqDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/faq.schema").FaqDocument, {}, {}> & import("./schema/faq.schema").Faq & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    deleteFaq(query: any): Promise<{
        message: string;
    }>;
}
