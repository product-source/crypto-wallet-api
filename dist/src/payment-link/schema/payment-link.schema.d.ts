import mongoose from "mongoose";
import { FiatCurrency, PaymentStatus, TransactionType, WithdrawPaymentStatus } from "./payment.enum";
import { WalletType } from "src/wallet-monitor/schema/wallet-monitor.enum";
export type PaymentLinkDocument = PaymentLink & Document;
declare class block {
    number: string;
    hash: string;
    timestamp: string;
}
export declare class PaymentLink {
    appId: mongoose.Types.ObjectId;
    chainId: string;
    toAddress: string;
    block: block;
    hash: string;
    gas: string;
    gasPrice: string;
    nonce: string;
    fromAddress: string;
    tokenName: string;
    taxSymbol: string;
    tokenDecimals: string;
    recivedAmount: string;
    tokenAddress: string;
    code: string;
    symbol: string;
    amount: string;
    buyerEmail: string;
    privateKey: string;
    buyerName: string;
    itemName: string;
    itemNumber: string;
    invoice: string;
    custom: string;
    linkURL: string;
    successUrl: string;
    cancelUrl: string;
    expireTime: number;
    status: PaymentStatus;
    withdrawStatus: WithdrawPaymentStatus;
    type: WalletType;
    adminFee: string;
    adminFeeWallet: string;
    amountAfterTax: string;
    transactionType: TransactionType;
    fiatCurrency: FiatCurrency;
    coinId: String;
    cryptoAmount: String;
    pricePerCoin: String;
    fiatAmount: String;
    usdAmount: String;
    cryptoToUsd: String;
    fiatToUsd: String;
    metadata: Record<string, any>;
}
export declare const PaymentLinkSchema: mongoose.Schema<PaymentLink, mongoose.Model<PaymentLink, any, any, any, mongoose.Document<unknown, any, PaymentLink, any, {}> & PaymentLink & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, PaymentLink, mongoose.Document<unknown, {}, mongoose.FlatRecord<PaymentLink>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<PaymentLink> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
