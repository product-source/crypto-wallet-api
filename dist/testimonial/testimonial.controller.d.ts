import { TestimonialService } from "./testimonial.service";
import { AddTestimonialDto, UpdateTestimonialDto } from "./dto/testimonial.dto";
export declare class TestimonialController {
    private readonly testimonialService;
    constructor(testimonialService: TestimonialService);
    addPage(dto: AddTestimonialDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/testimonial.schema").TestimonialDocument, {}, {}> & import("./schema/testimonial.schema").Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/testimonial.schema").TestimonialDocument, {}, {}> & import("./schema/testimonial.schema").Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdateTestimonialDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/testimonial.schema").TestimonialDocument, {}, {}> & import("./schema/testimonial.schema").Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    slugPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/testimonial.schema").TestimonialDocument, {}, {}> & import("./schema/testimonial.schema").Testimonial & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
