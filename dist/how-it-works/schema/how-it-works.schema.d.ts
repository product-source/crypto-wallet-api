export type HowItWorksDocument = HowItWorks & Document;
export declare class HowItWorks {
    name: string;
    slug: string;
    title: string;
    subTitle: string;
    heading1: string;
    description1: string;
    heading2: string;
    description2: string;
    heading3: string;
    description3: string;
    heading4: string;
    description4: string;
}
export declare const HowItWorksSchema: import("mongoose").Schema<HowItWorks, import("mongoose").Model<HowItWorks, any, any, any, import("mongoose").Document<unknown, any, HowItWorks, any, {}> & HowItWorks & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HowItWorks, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<HowItWorks>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<HowItWorks> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
