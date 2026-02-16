import { AppsService } from "./apps.service";
import { CreateAppsDto, UpdateAppsDto } from "./dto/apps.dto";
import { UpdateWebhookDto, GetWebhookLogsDto } from "src/webhook/dto/webhook.dto";
import { WebhookService } from "src/webhook/webhook.service";
export declare class AppsController {
    private readonly appsService;
    private readonly webhookService;
    constructor(appsService: AppsService, webhookService: WebhookService);
    addApp(req: any, dto: CreateAppsDto, file: any): Promise<{
        message: string;
    }>;
    getApp(req: any, query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        merchantTotalFiat: number;
        data: (import("./schema/apps.schema").Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getAppById(req: any, query: any): Promise<{
        message: string;
        totalFiatToUsd: number;
        totalSuccessFiat: number;
        totalPendingWithdraw: number;
        data: import("./schema/apps.schema").Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getKeys(req: any, query: any): Promise<import("@nestjs/common").NotFoundException | {
        message: string;
        publicKey: string;
        privateKey: string;
    }>;
    updateApp(req: any, query: any, dto: UpdateAppsDto, file: any): Promise<import("@nestjs/common").NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/apps.schema").AppsDocument, {}, {}> & import("./schema/apps.schema").Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    deleteApp(req: any, query: any): Promise<import("@nestjs/common").NotFoundException | {
        message: string;
    }>;
    getUnreadNotificationCount(req: any): Promise<{
        message: string;
        count: number;
    }>;
    appList(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/apps.schema").AppsDocument, {}, {}> & import("./schema/apps.schema").Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    viewMerchantApp(query: any): Promise<{
        message: string;
        app: {
            apiKey: string;
            secretKey: string;
            merchantId: import("mongoose").Types.ObjectId;
            name: string;
            description: string;
            logo: string;
            API_KEY: string;
            SECRET_KEY: string;
            EVMWalletMnemonic: import("./schema/apps.schema").EvmDetails;
            TronWalletMnemonic: import("./schema/apps.schema").EvmDetails;
            BtcWalletMnemonic: import("./schema/apps.schema").EvmDetails;
            currentIndexVal: number;
            tronCurrentIndexVal: number;
            btcCurrentIndexVal: number;
            totalFiatBalance: number;
            theme: string;
            webhookUrl: string;
            webhookSecret: string;
            isUserWithdrawalEnabled: boolean;
            isAutoWithdrawalEnabled: boolean;
            maxAutoWithdrawalLimit: number;
            minWithdrawalAmount: number;
            dailyWithdrawalRequestLimit: number;
            dailyWithdrawalAmountLimit: number;
            withdrawalCooldownMinutes: number;
            _id: import("mongoose").Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            id?: any;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        };
    }>;
    updateWebhook(dto: UpdateWebhookDto): Promise<{
        status: boolean;
        message: string;
        webhookUrl: any;
    }>;
    getWebhookLogs(dto: GetWebhookLogsDto): Promise<any>;
}
