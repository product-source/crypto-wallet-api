import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";
import { Merchant } from "src/merchants/schema/merchant.schema";
import { PaymentStatus } from "src/payment-link/schema/payment.enum";
import { TransactionTypes } from "./enum";

export type MerchantAppTxDocument = MerchantAppTx & Document;

class block {
  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class MerchantAppTx {
  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: Merchant.name,
  //   required: true,
  // })
  // merchantId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
    required: true,
  })
  appsId: mongoose.Types.ObjectId;

  @Prop()
  note: string;

  @Prop()
  blockNumber: string;

  // ++++++++++++++++++++++++++++++++++++++++++++++++

  @Prop({ default: PaymentStatus.PENDING })
  status: PaymentStatus;

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
  tokenSymbol: string;

  @Prop()
  tokenDecimals: string;

  @Prop({ default: "" })
  recivedAmount: string;

  @Prop({ required: true })
  toAddress: string;

  // ----------------------------------------------------------------

  @Prop({ required: true })
  chainId: string;

  @Prop()
  symbol: string;

  @Prop({ default: "APP" })
  type: PaymentStatus;

  @Prop({ default: TransactionTypes.DEPOSIT })
  txType: TransactionTypes;

  @Prop({ default: "" })
  file: string;

  @Prop({ default: "" })
  invoice: string;

  @Prop()
  adminFee: string;

  @Prop()
  adminFeeWallet: string;

  @Prop()
  adminFeeTxHash: string;
}

export const MerchantAppTxSchema = SchemaFactory.createForClass(MerchantAppTx);
