import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import { Merchant } from "src/merchants/schema/merchant.schema";
import { UserWithdrawalStatus } from "./user-withdrawal.enum";

export type UserWithdrawalDocument = UserWithdrawal & mongoose.Document;

@Schema({ timestamps: true })
export class UserWithdrawal {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Apps.name,
        required: true,
    })
    appsId: mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Merchant.name,
        required: true,
    })
    merchantId: mongoose.Types.ObjectId;

    // External user identification from merchant's platform
    @Prop({ required: true })
    userId: string; // Merchant's internal user ID (e.g., casino user ID)

    @Prop()
    userEmail: string; // Optional user email

    @Prop()
    userName: string; // Optional user name

    // Withdrawal details
    @Prop({ required: true })
    amount: string; // Amount in crypto

    @Prop({ required: true })
    tokenId: string; // Reference to token (USDT, ETH, TRX, etc.)

    @Prop({ required: true })
    tokenSymbol: string; // Token symbol for easy display

    @Prop({ required: true })
    chainId: string; // Blockchain network

    @Prop({ required: true })
    walletAddress: string; // User's withdrawal address

    @Prop()
    note: string; // Optional note from merchant

    // Status tracking
    @Prop({
        default: UserWithdrawalStatus.PENDING,
        enum: UserWithdrawalStatus,
    })
    status: UserWithdrawalStatus;

    @Prop()
    merchantApprovedAt: Date;

    @Prop()
    processedAt: Date;

    @Prop()
    txHash: string; // Blockchain transaction hash

    @Prop()
    adminFee: string; // Platform fee deducted

    @Prop()
    failureReason: string; // Reason if failed

    @Prop()
    externalReference: string; // Merchant's reference ID for their tracking

    @Prop()
    declineReason: string; // Reason if declined by merchant

    // For tracking limits
    @Prop()
    amountInUsd: number; // Amount converted to USD for limit checking

    // Track if auto-approval was blocked due to insufficient funds
    @Prop({ default: false })
    insufficientFundsAtCreation: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const UserWithdrawalSchema =
    SchemaFactory.createForClass(UserWithdrawal);

// Add indexes for efficient querying
UserWithdrawalSchema.index({ appsId: 1, status: 1 });
UserWithdrawalSchema.index({ appsId: 1, userId: 1, createdAt: -1 });
UserWithdrawalSchema.index({ merchantId: 1, status: 1 });
