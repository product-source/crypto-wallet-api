import mongoose from "mongoose";
import { WithdrawlFiatPaymentStatus } from "src/payment-link/schema/payment.enum";
export type FiatWithdrawDocument = FiatWithdraw & Document;
export declare class FiatWithdraw {
    appsId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    totalFiatBalance: number;
    minimumWithdrawl: number;
    withdrawlAmount: number;
    currency: string;
    cryptoValue: number;
    walletAddress: string;
    note: string;
    status: WithdrawlFiatPaymentStatus;
    transferDate: Date;
    txHash: string;
}
export declare const FiatWithdrawSchema: mongoose.Schema<FiatWithdraw, mongoose.Model<FiatWithdraw, any, any, any, mongoose.Document<unknown, any, FiatWithdraw, any, {}> & FiatWithdraw & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, FiatWithdraw, mongoose.Document<unknown, {}, mongoose.FlatRecord<FiatWithdraw>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<FiatWithdraw> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
