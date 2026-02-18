import { MerchantAppTx, MerchantAppTxDocument } from "./schema/merchant-app-tx.schema";
import { Model } from "mongoose";
import { AddTransactionDto, adminFiatTransferDto, CryptoTransaction, WithdrawFiat } from "./dto/merchant-app-tx.dto";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import { PaymentLink, PaymentLinkDocument } from "src/payment-link/schema/payment-link.schema";
import { EmailService } from "src/emails/email.service";
import { AdminService } from "src/admin/admin.service";
import { TokenService } from "src/token/token.service";
import { EncryptionService } from "src/utils/encryption.service";
import { Merchant } from "src/merchants/schema/merchant.schema";
import { FiatWithdraw, FiatWithdrawDocument } from "./schema/fiat-withdraw.schema";
export declare class MerchantAppTxService {
    private readonly appsModel;
    private readonly merchantTxModel;
    private readonly merchantModel;
    private readonly paymentLinkModel;
    private readonly fiatWithdrawModel;
    private readonly emailService;
    private readonly adminService;
    private readonly tokenService;
    private encryptionService;
    constructor(appsModel: Model<AppsDocument>, merchantTxModel: Model<MerchantAppTxDocument>, merchantModel: Model<Merchant>, paymentLinkModel: Model<PaymentLinkDocument>, fiatWithdrawModel: Model<FiatWithdrawDocument>, emailService: EmailService, adminService: AdminService, tokenService: TokenService, encryptionService: EncryptionService);
    uploadFile(file: Express.Multer.File): Promise<string>;
    addTransaction(user: any, dto: AddTransactionDto, file: Express.Multer.File): Promise<{
        status: boolean;
    }>;
    getMerchatAppsAllTx(query: any, user: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, MerchantAppTxDocument, {}, {}> & MerchantAppTx & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getAppTx(query: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, MerchantAppTxDocument, {}, {}> & MerchantAppTx & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getAppIdTxList(query: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: ((import("mongoose").Document<unknown, {}, PaymentLinkDocument, {}, {}> & PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }) | (import("mongoose").Document<unknown, {}, MerchantAppTxDocument, {}, {}> & MerchantAppTx & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }))[];
    }>;
    updateInMerchantTxTable(dto: AddTransactionDto): Promise<{
        status: boolean;
        message?: undefined;
    } | {
        status: boolean;
        message: any;
    }>;
    getFee(token: any, amount: any): Promise<{
        MFIP: any;
        WA: any;
        AWA: any;
        AC: any;
    }>;
    merchantWithdraw(user: any, dto: CryptoTransaction): Promise<{
        message: string;
        status: boolean;
        merchantReceipt?: undefined;
        adminReceipt?: undefined;
    } | {
        merchantReceipt: any;
        adminReceipt: any;
        message?: undefined;
        status?: undefined;
    }>;
    merchantWithdrawFiat(user: any, dto: WithdrawFiat): Promise<{
        success: boolean;
        message: string;
        model: import("mongoose").Document<unknown, {}, FiatWithdrawDocument, {}, {}> & FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getmerchantWithdrawFiatTxList(user: any, query: any): Promise<{
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, FiatWithdrawDocument, {}, {}> & FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    generatePdf(data: any): Promise<object>;
    getmerchantWithdrawFiatTxListinAdmin(user: any, query: any): Promise<{
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, FiatWithdrawDocument, {}, {}> & FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    adminFiatTransfer(query: any, dto: adminFiatTransferDto): Promise<{
        success: boolean;
        data: string;
        withdrawData: import("mongoose").Document<unknown, {}, FiatWithdrawDocument, {}, {}> & FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
        appInfo: import("mongoose").Document<unknown, {}, AppsDocument, {}, {}> & Apps & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    viewFiatTransactionById(query: any): Promise<{
        success: boolean;
        message: string;
        fiatData: import("mongoose").Document<unknown, {}, FiatWithdrawDocument, {}, {}> & FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
