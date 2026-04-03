export type OtherPageDocument = OtherPage & Document;
export declare class OtherPage {
    name: string;
    slug: string;
    title: string;
    subTitle: string;
    description: string;
}
export declare const OtherPageSchema: import("mongoose").Schema<OtherPage, import("mongoose").Model<OtherPage, any, any, any, import("mongoose").Document<unknown, any, OtherPage, any, {}> & OtherPage & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OtherPage, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<OtherPage>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<OtherPage> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
