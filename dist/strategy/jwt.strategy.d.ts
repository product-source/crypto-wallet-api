import { Strategy } from "passport-jwt";
import { AdminDocument } from "src/admin/schema/admin.schema";
import { Model } from "mongoose";
import { MerchantDocument } from "src/merchants/schema/merchant.schema";
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private adminModel;
    private merchantModel;
    constructor(adminModel: Model<AdminDocument>, merchantModel: Model<MerchantDocument>);
    validate(payload: any): Promise<{
        userId: any;
        email: any;
        isAdmin: any;
        role: any;
        permissions: any;
    }>;
}
export {};
