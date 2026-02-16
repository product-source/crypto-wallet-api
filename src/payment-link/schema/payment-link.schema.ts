import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import {
  CoinId,
  FiatCurrency,
  PaymentStatus,
  TransactionType,
  WithdrawPaymentStatus,
} from "./payment.enum";
import { WalletType } from "src/wallet-monitor/schema/wallet-monitor.enum";

export type PaymentLinkDocument = PaymentLink & Document;

class block {
  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({
  timestamps: true,

  toJSON: {
    virtuals: true,
    transform: function (doc, ret: any) {
      delete ret.privateKey;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret: any) {
      delete ret.privateKey;
      return ret;
    },
  },
})
export class PaymentLink {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
    required: true,
  })
  appId: mongoose.Types.ObjectId;

  // ++++++++++++++++++++++++++++++++++++++++++++++++

  @Prop({ required: true })
  chainId: string;

  @Prop({ required: true })
  toAddress: string;

  @Prop({ type: block, default: {} })
  block: block;

  @Prop()
  hash: string;

  @Prop()
  gas: string;

  @Prop()
  gasPrice: string;

  @Prop()
  nonce: string;

  @Prop()
  fromAddress: string;

  @Prop()
  tokenName: string;

  @Prop()
  taxSymbol: string;

  @Prop()
  tokenDecimals: string;

  @Prop()
  recivedAmount: string;

  // ----------------------------------------------------------------

  @Prop({ required: true })
  tokenAddress: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  symbol: string;

  @Prop()
  amount: string;

  @Prop({ required: true })
  buyerEmail: string;

  @Prop({ required: true })
  privateKey: string;

  @Prop()
  buyerName: string;

  @Prop()
  itemName: string;

  @Prop()
  itemNumber: string;

  @Prop()
  invoice: string;

  @Prop()
  custom: string;

  @Prop()
  linkURL: string;

  @Prop()
  successUrl: string;

  @Prop()
  cancelUrl: string;

  @Prop({ required: true })
  expireTime: number;

  @Prop({ default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ default: WithdrawPaymentStatus.PENDING })
  withdrawStatus: WithdrawPaymentStatus;

  @Prop({ default: WalletType.PAYMENT_LINK })
  type: WalletType;

  @Prop()
  adminFee: string;

  @Prop()
  adminFeeWallet: string;

  @Prop()
  amountAfterTax: string;

  @Prop()
  transactionType: TransactionType;

  @Prop()
  fiatCurrency: FiatCurrency;

  // @Prop()
  // coinId: CoinId;

  @Prop()
  coinId: String;

  @Prop()
  cryptoAmount: String;

  @Prop()
  pricePerCoin: String;

  @Prop()
  fiatAmount: String;

  @Prop()
  usdAmount: String;

  @Prop()
  cryptoToUsd: String;

  @Prop()
  fiatToUsd: String;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PaymentLinkSchema = SchemaFactory.createForClass(PaymentLink);
