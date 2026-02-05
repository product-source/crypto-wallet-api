import { DaysType, FiatCurrency, TransactionType, WithdrawType } from "../schema/payment.enum";
export declare class AddPaymnetLinkDto {
    appId: any;
    apiKey: string;
    secretKey: string;
    code: string;
    amount: string;
    buyerEmail: string;
    address: string;
    buyerName: string;
    itemName: string;
    itemNumber: string;
    invoice: string;
    custom: string;
    ipnUrl: string;
    successUrl: string;
    cancelUrl: string;
    transactionType: TransactionType;
    fiatCurrency: FiatCurrency;
}
export declare class DepositFundDto {
    paymentId: string;
    tokenBalance: string;
}
export declare class FundWithdrawDto {
    paymentId: string;
    chainId: string;
    amount: number;
    withdrawType: WithdrawType;
}
export declare class TableDataDto {
    startDate: string;
    endDate: string;
    token: string;
    timeFormat: DaysType;
}
export declare class GetPaymentLinkTronBalance {
    paymentId: string;
}
