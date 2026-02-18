import mongoose from "mongoose";
import { UserWithdrawalStatus } from "./user-withdrawal.enum";
export type UserWithdrawalDocument = UserWithdrawal & mongoose.Document;
export declare class UserWithdrawal {
    appsId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    userId: string;
    userEmail: string;
    userName: string;
    amount: string;
    tokenId: string;
    tokenSymbol: string;
    chainId: string;
    walletAddress: string;
    note: string;
    status: UserWithdrawalStatus;
    merchantApprovedAt: Date;
    processedAt: Date;
    txHash: string;
    adminFee: string;
    failureReason: string;
    externalReference: string;
    declineReason: string;
    amountInUsd: number;
    insufficientFundsAtCreation: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserWithdrawalSchema: mongoose.Schema<UserWithdrawal, mongoose.Model<UserWithdrawal, any, any, any, mongoose.Document<unknown, any, UserWithdrawal, any, {}> & UserWithdrawal & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, UserWithdrawal, mongoose.Document<unknown, {}, mongoose.FlatRecord<UserWithdrawal>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<UserWithdrawal> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
