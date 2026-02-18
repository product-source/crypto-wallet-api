import mongoose from "mongoose";
export type MerchantDocument = Merchant & Document;
export declare class Merchant {
    inquiryId: mongoose.Types.ObjectId;
    name: string;
    platformName: string;
    platformCategory: string;
    countryCode: string;
    contactNumber: string;
    email: string;
    location: string;
    description: string;
    password: string;
    isAccountCreated: boolean;
    acceptTermsConditions: string;
    verificationToken: string;
    isAccountSuspend: boolean;
    isMFA: boolean;
    isNotification: boolean;
    twoFactorSecret: string;
    isTwoFactorEnabled: boolean;
    isGoogle2FA: boolean;
    otp: number;
    otpExpire: number;
    createdAt: Date;
    updatedAt: Date;
    totalFiatBalance: number;
    isIPWhitelistEnabled: boolean;
    whitelistedIPs: string[];
}
export declare const MerchantSchema: mongoose.Schema<Merchant, mongoose.Model<Merchant, any, any, any, mongoose.Document<unknown, any, Merchant, any, {}> & Merchant & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Merchant, mongoose.Document<unknown, {}, mongoose.FlatRecord<Merchant>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Merchant> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
