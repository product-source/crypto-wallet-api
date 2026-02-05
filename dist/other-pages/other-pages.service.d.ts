import { OtherPage, OtherPageDocument } from "./schema/other-pages.schema";
import { Model } from "mongoose";
import { AddOtherPageDto, UpdateOtherPageDto } from "./dto/other-pages.dto";
export declare class OtherPagesService {
    private readonly otherPageModel;
    constructor(otherPageModel: Model<OtherPageDocument>);
    ensureDefaultOtherPageExist(): Promise<void>;
    addPage(dto: AddOtherPageDto): Promise<{
        message: string;
    }>;
    pagesList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, OtherPageDocument, {}, {}> & OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(id: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, OtherPageDocument, {}, {}> & OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewApis(): Promise<{
        message: string;
        page: (import("mongoose").Document<unknown, {}, OtherPageDocument, {}, {}> & OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    updateAPICard(dto: UpdateOtherPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, OtherPageDocument, {}, {}> & OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewPageBySlug(slug: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, OtherPageDocument, {}, {}> & OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
