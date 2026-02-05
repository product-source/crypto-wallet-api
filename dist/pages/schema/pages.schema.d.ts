export type PageDocument = Page & Document;
export declare class Page {
    name: string;
    slug: string;
    title: string;
    subTitle: string;
    heading: string;
    description: string;
    otherValues: string[];
    serviceHeading: string[];
    serviceSubHeading: string[];
}
export declare const PageSchema: import("mongoose").Schema<Page, import("mongoose").Model<Page, any, any, any, import("mongoose").Document<unknown, any, Page, any, {}> & Page & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Page, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Page>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Page> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
