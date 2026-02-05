import mongoose from "mongoose";
import { PaymentStatus } from "src/payment-link/schema/payment.enum";
import { TransactionTypes } from "./enum";
export type MerchantAppTxDocument = MerchantAppTx & Document;
declare class block {
    number: string;
    hash: string;
    timestamp: string;
}
export declare class MerchantAppTx {
    appsId: mongoose.Types.ObjectId;
    note: string;
    blockNumber: string;
    status: PaymentStatus;
    block: block;
    hash: string;
    gas: string;
    gasPrice: string;
    nonce: string;
    fromAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: string;
    recivedAmount: string;
    toAddress: string;
    chainId: string;
    symbol: string;
    type: PaymentStatus;
    txType: TransactionTypes;
    file: string;
    invoice: string;
    adminFee: string;
    adminFeeWallet: string;
    adminFeeTxHash: string;
}
export declare const MerchantAppTxSchema: mongoose.Schema<MerchantAppTx, mongoose.Model<MerchantAppTx, any, any, any, mongoose.Document<unknown, any, MerchantAppTx, any, {}> & MerchantAppTx & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, MerchantAppTx, mongoose.Document<unknown, {}, mongoose.FlatRecord<MerchantAppTx>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<MerchantAppTx> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
