import { Page, PageDocument } from "./schema/pages.schema";
import { Model } from "mongoose";
import { AddPageDto, UpdatePageDto } from "./dto/pages.dto";
import { UploadFileDocument } from "./schema/uploadFile.schema";
export declare class PagesService {
    private readonly pageModel;
    private readonly imageModel;
    constructor(pageModel: Model<PageDocument>, imageModel: Model<UploadFileDocument>);
    ensureDefaultPageExist(): Promise<void>;
    addPage(dto: AddPageDto): Promise<{
        message: string;
    }>;
    pagesList(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, PageDocument, {}, {}> & Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(id: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, PageDocument, {}, {}> & Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdatePageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, PageDocument, {}, {}> & Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    uploadFile(image: Express.Multer.File): Promise<{
        message: string;
        uploaded: boolean;
        url: string;
        imageUrl: string;
    }>;
    viewPageBySlug(slug: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, PageDocument, {}, {}> & Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
