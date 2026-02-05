import { Model } from "mongoose";
import { Testimonial, TestimonialDocument } from "./schema/testimonial.schema";
import { AddTestimonialDto, UpdateTestimonialDto } from "./dto/testimonial.dto";
export declare class TestimonialService {
    private readonly testimonialModel;
    constructor(testimonialModel: Model<TestimonialDocument>);
    ensureDefaultTestimonialExist(): Promise<void>;
    addPage(dto: AddTestimonialDto): Promise<{
        message: string;
    }>;
    pagesList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, TestimonialDocument, {}, {}> & Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(id: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, TestimonialDocument, {}, {}> & Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdateTestimonialDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TestimonialDocument, {}, {}> & Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewPageBySlug(slug: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, TestimonialDocument, {}, {}> & Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
