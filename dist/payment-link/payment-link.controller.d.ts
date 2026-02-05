import { PaymentLinkService } from "./payment-link.service";
import { AddPaymnetLinkDto, DepositFundDto, FundWithdrawDto, GetPaymentLinkTronBalance, TableDataDto } from "./dto/payment-link.dto";
export declare class PaymentLinkController {
    private readonly paymentLinkService;
    constructor(paymentLinkService: PaymentLinkService);
    addPaymentLink(dto: AddPaymnetLinkDto, clientIp: string, req: any): Promise<{
        message: string;
        link: import("mongoose").Document<unknown, {}, import("./schema/payment-link.schema").PaymentLinkDocument, {}, {}> & import("./schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getWalletTransaction(query: any): Promise<import("@moralisweb3/common-evm-utils").GetWalletTokenTransfersResponseAdapter>;
    getMerchantTxList(query: any, req: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/payment-link.schema").PaymentLinkDocument, {}, {}> & import("./schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getMerchantTxById(query: any): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("./schema/payment-link.schema").PaymentLinkDocument, {}, {}> & import("./schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getAllPaymentLinks(query: any, req: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/payment-link.schema").PaymentLinkDocument, {}, {}> & import("./schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getPaymentLinksById(query: any): Promise<{
        data: import("./schema/payment-link.schema").PaymentLink & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    paymentLinkCount(body: any): Promise<{
        message: string;
        total: number;
        monthlyCounts: any[];
        timePeriodArray: any;
    }>;
    adminFeeCount(body: any): Promise<{
        message: string;
        paymentLinks: any[];
        merchant: any[];
        periodNames: any[];
    }>;
    cryptoMargins(body: any): Promise<{
        message: string;
        data: {
            period: string;
            tokenCounts: Record<string, number>;
            totalCounts: number;
        }[];
        periodNames: string[];
    }>;
    depositsWithdrawalsCount(body: any): Promise<{
        message: string;
        withdrawals: any[];
        deposits: any[];
        periodNames: any[];
    }>;
    merchantPaymentLink(query: any): Promise<number>;
    merchantActiveApps(query: any): Promise<number>;
    depositTxFeeByAdmin(req: any, dto: DepositFundDto): Promise<any>;
    withdrawFund(req: any, dto: FundWithdrawDto): Promise<{
        receipt: any;
    }>;
    getUserPaymentsLinksAmountSum(req: any): Promise<{
        data: {
            month: any;
            totalPrice: any;
        }[];
    }>;
    getUserBalanceSum(query: any, req: any): Promise<{
        currency: any;
        data: {
            name: any;
            symbol: string;
            balance: number;
            currencyConversion: any;
        }[];
        usdTotal: number;
    }>;
    getMerchantCryptoSymbols(): Promise<{}>;
    tablePaymentLinkCount(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: any;
        data: any[];
    }>;
    tableMerchantDepositWithdrawCount(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: any;
        data: any[];
    }>;
    tableRevenueReportCount(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: string;
        totalAdminFee: any;
        data: any[];
    }>;
    tablePaymentLinkRevenueReportCount(dto: TableDataDto): Promise<{
        message: string;
        total: number;
        symbol: string;
        totalAdminFee: any;
        data: any[];
    }>;
    withdrawPaymentLinkFundsByAdmin(req: any, dto: FundWithdrawDto): Promise<{
        receipt: any;
    }>;
    getPaymentLinkTronTokenBalance(req: any, dto: GetPaymentLinkTronBalance): Promise<{
        ethBalanceEther: any;
        tokenBalanceEther: any;
    }>;
}
