import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import { WalletType } from "./wallet-monitor.enum";
import { PaymentLink } from "src/payment-link/schema/payment-link.schema";

export type WalletMonitorDocument = WalletMonitor & Document;

@Schema({ timestamps: true })
export class WalletMonitor {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
  })
  appId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: PaymentLink.name,
  })
  paymentLinkId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ default: 0 })
  expiryTime: number;

  @Prop({ required: true })
  walletType: WalletType;

  @Prop({ required: true })
  isExpiry: boolean;

  @Prop({ required: true })
  tokenAddress: string;

  @Prop({ required: true })
  chainId: string;

  @Prop()
  streamId: string;

  @Prop()
  amount: string;

  @Prop()
  transactionType: string;
}

export const WalletMonitorSchema = SchemaFactory.createForClass(WalletMonitor);
