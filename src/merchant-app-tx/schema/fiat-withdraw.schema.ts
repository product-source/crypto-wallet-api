import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import { Merchant } from "src/merchants/schema/merchant.schema";
import {
  PaymentStatus,
  WithdrawlFiatPaymentStatus,
} from "src/payment-link/schema/payment.enum";
import { TransactionTypes } from "./enum";

export type FiatWithdrawDocument = FiatWithdraw & Document;

@Schema({ timestamps: true })
export class FiatWithdraw {
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

  @Prop()
  totalFiatBalance: number;

  @Prop()
  minimumWithdrawl: number;

  @Prop()
  withdrawlAmount: number;

  @Prop()
  currency: string;

  @Prop()
  cryptoValue: number;

  @Prop()
  walletAddress: string;

  @Prop()
  note: string;

  @Prop({ default: WithdrawlFiatPaymentStatus.PENDING })
  status: WithdrawlFiatPaymentStatus;

  @Prop()
  transferDate: Date;

  @Prop()
  txHash: string;
}

export const FiatWithdrawSchema = SchemaFactory.createForClass(FiatWithdraw);
