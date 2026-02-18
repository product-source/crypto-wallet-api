import { HowItWorksService } from './how-it-works.service';
import { AddHowItWorksPageDto, UpdateHowItWorksPageDto } from './dto/how-it-works.dto';
export declare class HowItWorksController {
    private readonly howItWorksService;
    constructor(howItWorksService: HowItWorksService);
    addPage(dto: AddHowItWorksPageDto): Promise<{
        message: string;
    }>;
    list(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/how-it-works.schema").HowItWorksDocument, {}, {}> & import("./schema/how-it-works.schema").HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/how-it-works.schema").HowItWorksDocument, {}, {}> & import("./schema/how-it-works.schema").HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePage(dto: UpdateHowItWorksPageDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/how-it-works.schema").HowItWorksDocument, {}, {}> & import("./schema/how-it-works.schema").HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    slugPage(query: any): Promise<{
        message: string;
        page: import("mongoose").Document<unknown, {}, import("./schema/how-it-works.schema").HowItWorksDocument, {}, {}> & import("./schema/how-it-works.schema").HowItWorks & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
