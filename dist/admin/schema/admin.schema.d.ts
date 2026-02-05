import { Role, Permission } from "src/auth/enums/role.enum";
export type AdminDocument = Admin & Document;
export declare class Admin {
    name: string;
    email: string;
    countryCode: string;
    contactNumber: string;
    password: string;
    verificationToken: string;
    platformFee: number;
    adminWallet: string;
    merchantFee: number;
    adminPrivateKey: string;
    tronPlatformFee: number;
    tronMerchantFee: number;
    tronAdminWallet: string;
    btcPlatformFee: number;
    btcMerchantFee: number;
    btcAdminWallet: string;
    role: Role;
    permissions: Permission[];
}
declare const AdminSchema: import("mongoose").Schema<Admin, import("mongoose").Model<Admin, any, any, any, import("mongoose").Document<unknown, any, Admin, any, {}> & Admin & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Admin, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Admin>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Admin> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export { AdminSchema };
