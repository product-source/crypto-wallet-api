import { MerchantAppTxService } from "./merchant-app-tx.service";
import { adminFiatTransferDto, CryptoTransaction, WithdrawFiat } from "./dto/merchant-app-tx.dto";
export declare class MerchantAppTxController {
    private readonly merchantAppTxService;
    constructor(merchantAppTxService: MerchantAppTxService);
    generatePdf(): Promise<any>;
    addTransaction(req: any, dto: any, file: Express.Multer.File): Promise<{
        status: boolean;
    }>;
    getMerchantTxList(query: any, req: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/merchant-app-tx.schema").MerchantAppTxDocument, {}, {}> & import("./schema/merchant-app-tx.schema").MerchantAppTx & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getTxList(query: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/merchant-app-tx.schema").MerchantAppTxDocument, {}, {}> & import("./schema/merchant-app-tx.schema").MerchantAppTx & Document & {
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
        data: ((import("mongoose").Document<unknown, {}, import("../payment-link/schema/payment-link.schema").PaymentLinkDocument, {}, {}> & import("../payment-link/schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }) | (import("mongoose").Document<unknown, {}, import("./schema/merchant-app-tx.schema").MerchantAppTxDocument, {}, {}> & import("./schema/merchant-app-tx.schema").MerchantAppTx & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }))[];
    }>;
    merchantWithdraw(req: any, dto: CryptoTransaction): Promise<{
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
    merchantFiatWithdraw(req: any, dto: WithdrawFiat): Promise<{
        success: boolean;
        message: string;
        model: import("mongoose").Document<unknown, {}, import("./schema/fiat-withdraw.schema").FiatWithdrawDocument, {}, {}> & import("./schema/fiat-withdraw.schema").FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    merchantFiatWithdrawList(req: any, query: any): Promise<{
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/fiat-withdraw.schema").FiatWithdrawDocument, {}, {}> & import("./schema/fiat-withdraw.schema").FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    merchantFiatWithdrawListinAdmin(req: any, query: any): Promise<{
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/fiat-withdraw.schema").FiatWithdrawDocument, {}, {}> & import("./schema/fiat-withdraw.schema").FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    adminFiatTransfer(req: any, query: any, dto: adminFiatTransferDto): Promise<{
        success: boolean;
        data: string;
        withdrawData: import("mongoose").Document<unknown, {}, import("./schema/fiat-withdraw.schema").FiatWithdrawDocument, {}, {}> & import("./schema/fiat-withdraw.schema").FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
        appInfo: import("mongoose").Document<unknown, {}, import("../apps/schema/apps.schema").AppsDocument, {}, {}> & import("../apps/schema/apps.schema").Apps & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    viewFiatWithdrawl(req: any, query: any): Promise<{
        success: boolean;
        message: string;
        fiatData: import("mongoose").Document<unknown, {}, import("./schema/fiat-withdraw.schema").FiatWithdrawDocument, {}, {}> & import("./schema/fiat-withdraw.schema").FiatWithdraw & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
}
