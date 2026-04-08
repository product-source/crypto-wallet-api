import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Role, Permission } from "src/auth/enums/role.enum";

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop()
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  countryCode: string;

  @Prop()
  contactNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  verificationToken: string;

  @Prop({ default: 0 })
  platformFee: number;

  @Prop()
  adminWallet: string;

  @Prop({ default: 0 })
  merchantFee: number;

  // @Prop()
  // merchantFeeWallet: string;

  @Prop()
  adminPrivateKey: string;

  @Prop({ default: 0 })
  tronPlatformFee: number;

  @Prop({ default: 0 })
  tronMerchantFee: number;

  @Prop()
  tronAdminWallet: string;

  @Prop({ default: 0 })
  btcPlatformFee: number;

  @Prop({ default: 0 })
  btcMerchantFee: number;

  @Prop()
  btcAdminWallet: string;

  @Prop()
  FiatEvmAdminWallet: string;

  @Prop()
  FiatTronAdminWallet: string;

  @Prop()
  FiatbtcAdminWallet: string;

  @Prop({ type: String, enum: Role, default: Role.SUB_ADMIN })
  role: Role;

  @Prop({ type: [String], enum: Permission, default: [] })
  permissions: Permission[];
}

const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export { AdminSchema };
