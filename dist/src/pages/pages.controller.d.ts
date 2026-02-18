import { PagesService } from "./pages.service";
import { AddPageDto, UpdatePageDto } from "./dto/pages.dto";
export declare class PagesController {
    private readonly pagesService;
    constructor(pagesService: PagesService);
    addPage(dto: AddPageDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/pages.schema").PageDocument, {}, {}> & import("./schema/pages.schema").Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/pages.schema").PageDocument, {}, {}> & import("./schema/pages.schema").Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdatePageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/pages.schema").PageDocument, {}, {}> & import("./schema/pages.schema").Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    uploadImage(image: Express.Multer.File): Promise<{
        message: string;
        uploaded: boolean;
        url: string;
        imageUrl: string;
    }>;
    slugPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/pages.schema").PageDocument, {}, {}> & import("./schema/pages.schema").Page & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
