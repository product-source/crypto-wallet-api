export type FaqDocument = Faq & Document;
export declare class Faq {
    question: string;
    answer: string;
}
export declare const FaqSchema: import("mongoose").Schema<Faq, import("mongoose").Model<Faq, any, any, any, import("mongoose").Document<unknown, any, Faq, any, {}> & Faq & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Faq, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Faq>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Faq> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
