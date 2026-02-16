import { NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { Apps, AppsDocument } from "./schema/apps.schema";
import { CreateAppsDto, UpdateAppsDto } from "./dto/apps.dto";
import { EncryptionService } from "src/utils/encryption.service";
import { WalletMonitorDocument } from "src/wallet-monitor/schema/wallet-monitor.schema";
import { NotificationDocument } from "src/notification/schema/notification.schema";
import { TokenDocument } from "src/token/schema/token.schema";
import { PaymentLinkDocument } from "src/payment-link/schema/payment-link.schema";
import { FiatWithdrawDocument } from "src/merchant-app-tx/schema/fiat-withdraw.schema";
import { MerchantDocument } from "src/merchants/schema/merchant.schema";
import { WebhookService } from "src/webhook/webhook.service";
export declare class AppsService {
    private readonly appsModel;
    private readonly merchantModel;
    private readonly monitorModel;
    private readonly notificationModel;
    private readonly tokenModel;
    private readonly paymentLinkModel;
    private readonly fiatWithdrawModel;
    private encryptionService;
    private webhookService;
    constructor(appsModel: Model<AppsDocument>, merchantModel: Model<MerchantDocument>, monitorModel: Model<WalletMonitorDocument>, notificationModel: Model<NotificationDocument>, tokenModel: Model<TokenDocument>, paymentLinkModel: Model<PaymentLinkDocument>, fiatWithdrawModel: Model<FiatWithdrawDocument>, encryptionService: EncryptionService, webhookService: WebhookService);
    addApp(user: any, dto: CreateAppsDto, file: any): Promise<{
        message: string;
    }>;
    getApps00(user: any, query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, AppsDocument, {}, {}> & Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getApps(user: any, query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        merchantTotalFiat: number;
        data: (Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    appById(user: any, query: any): Promise<{
        message: string;
        totalFiatToUsd: number;
        totalSuccessFiat: number;
        totalPendingWithdraw: number;
        data: Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getKeys(user: any, query: any): Promise<NotFoundException | {
        message: string;
        publicKey: string;
        privateKey: string;
    }>;
    updateApp(user: any, query: any, dto: UpdateAppsDto, file: any): Promise<NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, AppsDocument, {}, {}> & Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    deleteApp(user: any, query: any): Promise<NotFoundException | {
        message: string;
    }>;
    appList(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, AppsDocument, {}, {}> & Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getUnreadNotificationCount(user: any): Promise<{
        message: string;
        count: number;
    }>;
    viewMerchantApp(id: any): Promise<{
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
    updateWebhook(user: any, query: any, dto: any): Promise<{
        message: string;
        webhookUrl: any;
    }>;
    updateWebhookWithApiKey(dto: any): Promise<{
        status: boolean;
        message: string;
        webhookUrl: any;
    }>;
    getWebhookLogsWithApiKey(dto: any): Promise<any>;
}
