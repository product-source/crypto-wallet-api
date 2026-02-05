import mongoose from "mongoose";
export type TransactionDocument = Transaction & Document;
declare class block {
    number: string;
    hash: string;
    timestamp: string;
}
export declare class Transaction {
    appsId: mongoose.Types.ObjectId;
    transactionType: string;
    block: block;
    hash: string;
    gas: string;
    gasPrice: string;
    nonce: string;
    fromAddress: string;
    toAddress: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: string;
    valueWithDecimals: string;
    amountAfterTax: string;
}
export declare const TransactionSchema: mongoose.Schema<Transaction, mongoose.Model<Transaction, any, any, any, mongoose.Document<unknown, any, Transaction, any, {}> & Transaction & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Transaction, mongoose.Document<unknown, {}, mongoose.FlatRecord<Transaction>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Transaction> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
