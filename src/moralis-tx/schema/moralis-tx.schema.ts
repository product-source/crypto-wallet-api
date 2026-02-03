import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Apps } from "src/apps/schema/apps.schema";

export type TransactionDocument = Transaction & Document;

class block {
  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Apps.name,
    required: true,
  })
  appsId: mongoose.Types.ObjectId;

  @Prop()
  transactionType: string;

  // --------

  @Prop({ type: block, default: {} })
  block: block;

  @Prop({ required: true })
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
  toAddress: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  tokenName: string;

  @Prop()
  tokenSymbol: string;

  @Prop()
  tokenDecimals: string;

  @Prop()
  valueWithDecimals: string;

  @Prop()
  amountAfterTax: string;
  
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
