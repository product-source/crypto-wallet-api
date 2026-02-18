import { Model } from "mongoose";
import { HowItWorks, HowItWorksDocument } from "./schema/how-it-works.schema";
import { AddHowItWorksPageDto, UpdateHowItWorksPageDto } from "./dto/how-it-works.dto";
export declare class HowItWorksService {
    private readonly howItWorksModel;
    constructor(howItWorksModel: Model<HowItWorksDocument>);
    ensureDefaultWorkExist(): Promise<void>;
    addPage(dto: AddHowItWorksPageDto): Promise<{
        message: string;
    }>;
    pagesList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, HowItWorksDocument, {}, {}> & HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(id: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, HowItWorksDocument, {}, {}> & HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdateHowItWorksPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, HowItWorksDocument, {}, {}> & HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewPageBySlug(slug: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, HowItWorksDocument, {}, {}> & HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
