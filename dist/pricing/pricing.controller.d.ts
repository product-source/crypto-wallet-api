import { PricingService } from "./pricing.service";
import { AddPricingPageDto, UpdatePricingPageDto } from "./dto/pricing.dto";
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    addPage(dto: AddPricingPageDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/pricing.schema").PricingDocument, {}, {}> & import("./schema/pricing.schema").Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/pricing.schema").PricingDocument, {}, {}> & import("./schema/pricing.schema").Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdatePricingPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/pricing.schema").PricingDocument, {}, {}> & import("./schema/pricing.schema").Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    slugPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/pricing.schema").PricingDocument, {}, {}> & import("./schema/pricing.schema").Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
