export type InquiryDocument = Inquiry & Document;
export declare class Inquiry {
    name: string;
    platformName: string;
    platformCategory: string;
    countryCode: string;
    contactNumber: string;
    email: string;
    location: string;
    description: string;
    isAccountCreated: boolean;
}
export declare const InquirySchema: import("mongoose").Schema<Inquiry, import("mongoose").Model<Inquiry, any, any, any, import("mongoose").Document<unknown, any, Inquiry, any, {}> & Inquiry & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Inquiry, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Inquiry>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Inquiry> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
