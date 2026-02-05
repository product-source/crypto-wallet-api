import { MerchantsService } from "./merchants.service";
import { ChangeUserPasswordDto, checkPassword, ResetPasswordDto, StatusMerchantDto, UpdateUserProfileDto, VerifyMailDto } from "./dto/merchant.dto";
export declare class MerchantsController {
    private readonly merchantsService;
    constructor(merchantsService: MerchantsService);
    merchantList(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/merchant.schema").MerchantDocument, {}, {}> & import("./schema/merchant.schema").Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewMerchant(query: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, import("./schema/merchant.schema").MerchantDocument, {}, {}> & import("./schema/merchant.schema").Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    verifyUserMail(dto: VerifyMailDto): Promise<{
        message: string;
    }>;
    resetUserPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    userProfile(req: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/merchant.schema").MerchantDocument, {}, {}> & import("./schema/merchant.schema").Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateProfile(dto: UpdateUserProfileDto, req: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/merchant.schema").MerchantDocument, {}, {}> & import("./schema/merchant.schema").Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    changePassword(req: any, dto: ChangeUserPasswordDto): Promise<{
        success: boolean;
        msg: string;
    }>;
    changeStatus(dto: StatusMerchantDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/merchant.schema").MerchantDocument, {}, {}> & import("./schema/merchant.schema").Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    generateKey(): Promise<{
        publicKey: any;
        privateKey: any;
        encryptedPublicKey: string;
        encryptedPrivateKey: string;
        decryptedPublicKey: string;
        decryptedPrivateKey: string;
    }>;
    merchantCount(): Promise<{
        message: string;
        count: number;
    }>;
    userPassword(req: any, dto: checkPassword): Promise<{
        message: string;
        data: {
            privateKey: string;
            address: string;
        };
    }>;
}
