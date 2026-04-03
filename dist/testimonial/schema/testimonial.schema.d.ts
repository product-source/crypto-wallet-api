export type TestimonialDocument = Testimonial & Document;
export declare class Testimonial {
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
}
export declare const TestimonialSchema: import("mongoose").Schema<Testimonial, import("mongoose").Model<Testimonial, any, any, any, import("mongoose").Document<unknown, any, Testimonial, any, {}> & Testimonial & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Testimonial, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Testimonial>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Testimonial> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
