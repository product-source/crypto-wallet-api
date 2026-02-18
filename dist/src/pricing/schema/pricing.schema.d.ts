export type PricingDocument = Pricing & Document;
export declare class Pricing {
    name: string;
    slug: string;
    title: string;
    pricing: string;
    description: string;
}
export declare const PricingSchema: import("mongoose").Schema<Pricing, import("mongoose").Model<Pricing, any, any, any, import("mongoose").Document<unknown, any, Pricing, any, {}> & Pricing & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Pricing, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Pricing>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Pricing> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
