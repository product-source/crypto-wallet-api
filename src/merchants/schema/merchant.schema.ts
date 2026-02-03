import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Inquiry } from "src/inquiry/schema/inquiry.schema";

export type MerchantDocument = Merchant & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: any) => {
      delete ret.password; // Explicitly delete password in JSON response
      return ret;
    },
  },
  toObject: {
    transform: (_doc, ret: any) => {
      delete ret.password; // Explicitly delete password in Object response
      return ret;
    },
  },
})
export class Merchant {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Inquiry.name,
    required: true,
  })
  inquiryId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  platformName: string;

  @Prop({ required: true })
  platformCategory: string;

  @Prop()
  countryCode: string;

  @Prop()
  contactNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  description: string;

  @Prop({ select: false })
  password: string;

  @Prop()
  isAccountCreated: boolean;

  @Prop({ default: "false" })
  acceptTermsConditions: string;

  @Prop()
  verificationToken: string;

  // @Prop({ type: EvmDetails, default: {} })
  // EVMWalletMnemonic: EvmDetails;

  @Prop({ default: false })
  isAccountSuspend: boolean;

  @Prop({ default: true })
  isMFA: boolean;

  @Prop({ default: true })
  isNotification: boolean;

  @Prop({ select: false })
  twoFactorSecret: string;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop({ default: false })
  isGoogle2FA: boolean;

  @Prop()
  otp: number;

  @Prop()
  otpExpire: number;

  createdAt: Date;

  updatedAt: Date;


  @Prop()
  totalFiatBalance: number;

  @Prop({ default: false })
  isIPWhitelistEnabled: boolean;

  @Prop({ type: [String], default: [] })
  whitelistedIPs: string[];
}



export const MerchantSchema = SchemaFactory.createForClass(Merchant);
