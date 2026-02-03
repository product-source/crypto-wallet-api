import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Merchant } from "src/merchants/schema/merchant.schema";

export type AppsDocument = Apps & Document;

class Mnemonic {
  @Prop({ required: true, select: false })
  phrase: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  locale: string;
}

export class EvmDetails {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true, select: false }) // Exclude privateKey by default
  privateKey: string;

  @Prop({ type: Mnemonic, required: true, select: false }) // Exclude mnemonic by default
  mnemonic: Mnemonic;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: any) => {
      // Exclude sensitive fields during JSON transformation
      if (ret.EVMWalletMnemonic) {
        delete ret.EVMWalletMnemonic.privateKey;
        delete ret.EVMWalletMnemonic.mnemonic;
      }
      if (ret.TronWalletMnemonic) {
        delete ret.TronWalletMnemonic.privateKey;
        delete ret.TronWalletMnemonic.mnemonic;
      }
      if (ret.BtcWalletMnemonic) {
        delete ret.BtcWalletMnemonic.privateKey;
        delete ret.BtcWalletMnemonic.mnemonic;
      }
      return ret;
    },
  },
  toObject: {
    transform: (_doc, ret: any) => {
      // Exclude sensitive fields during object transformation
      if (ret.EVMWalletMnemonic) {
        delete ret.EVMWalletMnemonic.privateKey;
        delete ret.EVMWalletMnemonic.mnemonic;
      }
      if (ret.TronWalletMnemonic) {
        delete ret.TronWalletMnemonic.privateKey;
        delete ret.TronWalletMnemonic.mnemonic;
      }
      if (ret.BtcWalletMnemonic) {
        delete ret.BtcWalletMnemonic.privateKey;
        delete ret.BtcWalletMnemonic.mnemonic;
      }
      return ret;
    },
  },
})
export class Apps {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Merchant.name,
    required: true,
  })
  merchantId: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  logo: string;

  @Prop({ required: true })
  API_KEY: string;

  @Prop({ required: true })
  SECRET_KEY: string;

  @Prop({ type: EvmDetails, default: {} })
  EVMWalletMnemonic: EvmDetails;

  @Prop({ type: EvmDetails, default: {} })
  TronWalletMnemonic: EvmDetails;

  @Prop({ type: EvmDetails, default: {} })
  BtcWalletMnemonic: EvmDetails;

  @Prop()
  currentIndexVal: number;

  @Prop({ default: 0 })
  tronCurrentIndexVal: number;

  @Prop({ default: 0 })
  btcCurrentIndexVal: number;

  @Prop({ default: 0 })
  totalFiatBalance: number;

  @Prop({ default: "DARK", enum: ["WHITE", "DARK"] })
  theme: string;

  @Prop()
  webhookUrl: string;

  @Prop({ select: false })
  webhookSecret: string;
}

export const AppsSchema = SchemaFactory.createForClass(Apps);
