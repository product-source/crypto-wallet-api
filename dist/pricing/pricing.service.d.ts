import { Model } from "mongoose";
import { Pricing, PricingDocument } from "./schema/pricing.schema";
import { AddPricingPageDto, UpdatePricingPageDto } from "./dto/pricing.dto";
export declare class PricingService {
    private readonly pricingModel;
    constructor(pricingModel: Model<PricingDocument>);
    ensureDefaultPricingExist(): Promise<void>;
    addPage(dto: AddPricingPageDto): Promise<{
        message: string;
    }>;
    pagesList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, PricingDocument, {}, {}> & Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(id: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, PricingDocument, {}, {}> & Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdatePricingPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, PricingDocument, {}, {}> & Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewPageBySlug(slug: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, PricingDocument, {}, {}> & Pricing & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
