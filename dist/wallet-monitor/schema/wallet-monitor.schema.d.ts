import mongoose from "mongoose";
import { WalletType } from "./wallet-monitor.enum";
export type WalletMonitorDocument = WalletMonitor & Document;
export declare class WalletMonitor {
    appId: mongoose.Types.ObjectId;
    paymentLinkId: mongoose.Types.ObjectId;
    walletAddress: string;
    expiryTime: number;
    walletType: WalletType;
    isExpiry: boolean;
    tokenAddress: string;
    chainId: string;
    streamId: string;
    amount: string;
    transactionType: string;
}
export declare const WalletMonitorSchema: mongoose.Schema<WalletMonitor, mongoose.Model<WalletMonitor, any, any, any, mongoose.Document<unknown, any, WalletMonitor, any, {}> & WalletMonitor & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, WalletMonitor, mongoose.Document<unknown, {}, mongoose.FlatRecord<WalletMonitor>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<WalletMonitor> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
