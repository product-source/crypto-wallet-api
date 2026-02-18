import { OtherPagesService } from "./other-pages.service";
import { AddOtherPageDto, UpdateOtherPageDto } from "./dto/other-pages.dto";
export declare class OtherPagesController {
    private readonly otherPagesService;
    constructor(otherPagesService: OtherPagesService);
    addPage(dto: AddOtherPageDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/other-pages.schema").OtherPageDocument, {}, {}> & import("./schema/other-pages.schema").OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/other-pages.schema").OtherPageDocument, {}, {}> & import("./schema/other-pages.schema").OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdateOtherPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/other-pages.schema").OtherPageDocument, {}, {}> & import("./schema/other-pages.schema").OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    slugPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/other-pages.schema").OtherPageDocument, {}, {}> & import("./schema/other-pages.schema").OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewAPIs(): Promise<{
        message: string;
        page: (import("mongoose").Document<unknown, {}, import("./schema/other-pages.schema").OtherPageDocument, {}, {}> & import("./schema/other-pages.schema").OtherPage & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
}
