import { PaymentLink, PaymentLinkDocument } from "./schema/payment-link.schema";
import { Model } from "mongoose";
import { AddPaymnetLinkDto, TableDataDto } from "./dto/payment-link.dto";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { WalletMonitorDocument } from "src/wallet-monitor/schema/wallet-monitor.schema";
import { TokenDocument } from "src/token/schema/token.schema";
import { MerchantAppTxDocument } from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import { AdminService } from "src/admin/admin.service";
import { WebhookService } from "src/webhook/webhook.service";
export declare class PaymentLinkService {
    private readonly paymentLinkModel;
    private readonly appsModel;
    private readonly monitorModel;
    private readonly tokenModel;
    private encryptionService;
    private readonly merchantAppTxModel;
    private readonly adminService;
    private readonly webhookService;
    constructor(paymentLinkModel: Model<PaymentLinkDocument>, appsModel: Model<AppsDocument>, monitorModel: Model<WalletMonitorDocument>, tokenModel: Model<TokenDocument>, encryptionService: EncryptionService, merchantAppTxModel: Model<MerchantAppTxDocument>, adminService: AdminService, webhookService: WebhookService);
    getCoinIdFromCode(code: string): string;
    addPaymentLink(dto: AddPaymnetLinkDto, clientIp?: string): Promise<{
        message: string;
        link: import("mongoose").Document<unknown, {}, PaymentLinkDocument, {}, {}> & PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getWalletERC20Transactions(query: any): Promise<import("@moralisweb3/common-evm-utils").GetWalletTokenTransfersResponseAdapter>;
    getMerchantTransactions(query: any, user: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, PaymentLinkDocument, {}, {}> & PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getMerchantTransactionById(query: any): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, PaymentLinkDocument, {}, {}> & PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getAllPaymentLinks(query: any, user: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, PaymentLinkDocument, {}, {}> & PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getPaymentLinksById(query: any): Promise<{
        data: PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    count(query: any): Promise<{
        message: string;
        total: number;
        monthlyCounts: any[];
        timePeriodArray: any;
    }>;
    revenue(query: any): Promise<{
        message: string;
        paymentLinks: any[];
        merchant: any[];
        periodNames: any[];
    }>;
    cryptoMargins(query: any): Promise<{
        message: string;
        data: {
            period: string;
            tokenCounts: Record<string, number>;
            totalCounts: number;
        }[];
        periodNames: string[];
    }>;
    merchantDepositWithdrawals(query: any): Promise<{
        message: string;
        withdrawals: any[];
        deposits: any[];
        periodNames: any[];
    }>;
    getMerchantCryptoSymbols(): Promise<{}>;
    activePaymentLinks(query: any): Promise<number>;
    activeMerchantApps(query: any): Promise<number>;
    depositTxFeeByAdmin(user: any, dto: any): Promise<any>;
    withdrawFund(user: any, dto: any): Promise<{
        receipt: any;
    }>;
    getUserPaymentsLinksAmountSum(user: any): Promise<{
        data: {
            month: any;
            totalPrice: any;
        }[];
    }>;
    getUserBalanceSum(query: any, user: any): Promise<{
        currency: any;
        data: {
            name: any;
            symbol: string;
            balance: number;
            currencyConversion: any;
        }[];
        usdTotal: number;
    }>;
    tablePaymentLinkCount(dto: any): Promise<{
        message: string;
        total: number;
        symbol: any;
        data: any[];
    }>;
    tableMerchantDepositWithdrawCount(dto: any): Promise<{
        message: string;
        total: number;
        symbol: any;
        data: any[];
    }>;
    tableMerchantAppTxRevenueReports(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: string;
        totalAdminFee: any;
        data: any[];
    }>;
    tablePaymentLinkRevenueReports(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: string;
        totalAdminFee: any;
        data: any[];
    }>;
    withdrawPaymentLinkFundsByAdmin(dto: any, user: any): Promise<{
        receipt: any;
    }>;
    getPaymentLinkTronTokenBalance(dto: any, user: any): Promise<{
        ethBalanceEther: any;
        tokenBalanceEther: any;
    }>;
}
