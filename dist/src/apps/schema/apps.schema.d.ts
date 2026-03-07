import mongoose from "mongoose";
export type AppsDocument = Apps & mongoose.Document;
declare class Mnemonic {
    phrase: string;
    path: string;
    locale: string;
}
export declare class EvmDetails {
    address: string;
    privateKey: string;
    mnemonic: Mnemonic;
}
export declare class WhitelistedWallet {
    address: string;
    label: string;
    network: string;
}
export declare const WhitelistedWalletSchema: mongoose.Schema<WhitelistedWallet, mongoose.Model<WhitelistedWallet, any, any, any, mongoose.Document<unknown, any, WhitelistedWallet, any, {}> & WhitelistedWallet & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, WhitelistedWallet, mongoose.Document<unknown, {}, mongoose.FlatRecord<WhitelistedWallet>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<WhitelistedWallet> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Apps {
    merchantId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    logo: string;
    API_KEY: string;
    SECRET_KEY: string;
    EVMWalletMnemonic: EvmDetails;
    TronWalletMnemonic: EvmDetails;
    BtcWalletMnemonic: EvmDetails;
    currentIndexVal: number;
    tronCurrentIndexVal: number;
    btcCurrentIndexVal: number;
    totalFiatBalance: number;
    theme: string;
    webhookUrl: string;
    webhookSecret: string;
    isUserWithdrawalEnabled: boolean;
    isAutoWithdrawalEnabled: boolean;
    maxAutoWithdrawalLimit: number;
    minWithdrawalAmount: number;
    dailyWithdrawalRequestLimit: number;
    dailyWithdrawalAmountLimit: number;
    withdrawalCooldownMinutes: number;
    toleranceMargin: number;
    whitelistedWallets: WhitelistedWallet[];
}
export declare const AppsSchema: mongoose.Schema<Apps, mongoose.Model<Apps, any, any, any, mongoose.Document<unknown, any, Apps, any, {}> & Apps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Apps, mongoose.Document<unknown, {}, mongoose.FlatRecord<Apps>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Apps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
