import { Model } from "mongoose";
import { UserWithdrawal, UserWithdrawalDocument } from "./schema/user-withdrawal.schema";
import { UserWithdrawalStatus } from "./schema/user-withdrawal.enum";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import { TokenDocument } from "src/token/schema/token.schema";
import { MerchantDocument } from "src/merchants/schema/merchant.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { WebhookService } from "src/webhook/webhook.service";
import { CreateWithdrawalRequestDto, ApproveWithdrawalDto, DeclineWithdrawalDto, ListWithdrawalsDto, UpdateWithdrawalSettingsDto } from "./dto/user-withdrawal.dto";
export declare class UserWithdrawalService {
    private readonly userWithdrawalModel;
    private readonly appsModel;
    private readonly tokenModel;
    private readonly merchantModel;
    private readonly encryptionService;
    private readonly webhookService;
    constructor(userWithdrawalModel: Model<UserWithdrawalDocument>, appsModel: Model<AppsDocument>, tokenModel: Model<TokenDocument>, merchantModel: Model<MerchantDocument>, encryptionService: EncryptionService, webhookService: WebhookService);
    validateAppCredentials(appId: string, apiKey: string, secretKey: string): Promise<import("mongoose").Document<unknown, {}, AppsDocument, {}, {}> & Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    checkDailyLimits(appId: string, userId: string, amountInUsd: number): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    checkCooldown(appId: string, userId: string): Promise<{
        allowed: boolean;
        reason?: string;
        waitMinutes?: number;
    }>;
    checkChainBalance(app: any, token: any, amount: string): Promise<{
        sufficient: boolean;
        balance: string;
        required: string;
    }>;
    createWithdrawalRequest(dto: CreateWithdrawalRequestDto, app: any): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: UserWithdrawalStatus;
            externalReference: string;
            createdAt: Date;
        };
    }>;
    listWithdrawals(dto: ListWithdrawalsDto, merchantId?: string): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, UserWithdrawalDocument, {}, {}> & UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    approveWithdrawal(dto: ApproveWithdrawalDto, merchantId?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: UserWithdrawalStatus.APPROVED;
        };
    }>;
    declineWithdrawal(dto: DeclineWithdrawalDto, merchantId?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: UserWithdrawalStatus.DECLINED;
            declineReason: string;
        };
    }>;
    processWithdrawal(withdrawalId: string): Promise<{
        success: boolean;
        txHash: string;
    }>;
    getWalletBalance(appId: string): Promise<{
        success: boolean;
        data: {
            appId: string;
            balances: {
                tokenId: import("mongoose").Types.ObjectId;
                symbol: string;
                code: string;
                chainId: string;
                network: string;
                walletAddress: string;
                balance: string;
            }[];
        };
    }>;
    getWithdrawalStatus(withdrawalId: string, merchantId?: string): Promise<{
        success: boolean;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: UserWithdrawalStatus;
            txHash: string;
            failureReason: string;
            createdAt: Date;
            processedAt: Date;
        };
    }>;
    updateWithdrawalSettings(dto: UpdateWithdrawalSettingsDto, merchantId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    private sendWithdrawalWebhook;
    private sendWithdrawalEmail;
    getWithdrawalHistory(merchantId: string, query: {
        pageNo?: number;
        limitVal?: number;
        status?: string;
    }): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, UserWithdrawalDocument, {}, {}> & UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    adminListWithdrawals(query: {
        pageNo?: number;
        limitVal?: number;
        status?: string;
        merchantId?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, UserWithdrawalDocument, {}, {}> & UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
}
