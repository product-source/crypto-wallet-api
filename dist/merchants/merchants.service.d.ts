import { Model } from "mongoose";
import { Merchant, MerchantDocument } from "./schema/merchant.schema";
import { ChangeUserPasswordDto, checkPassword, ResetPasswordDto, StatusMerchantDto, UpdateUserProfileDto, VerifyMailDto } from "./dto/merchant.dto";
import { HashService } from "src/admin/hash.service";
import { EmailService } from "src/emails/email.service";
import { ethers } from "ethers";
import { EncryptionService } from "src/utils/encryption.service";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { NotificationDocument } from "src/notification/schema/notification.schema";
export declare class MerchantsService {
    private readonly merchantModel;
    private readonly notificationModel;
    private readonly emailService;
    private hashService;
    private encryptionService;
    private readonly appsModel;
    constructor(merchantModel: Model<MerchantDocument>, notificationModel: Model<NotificationDocument>, emailService: EmailService, hashService: HashService, encryptionService: EncryptionService, appsModel: Model<AppsDocument>);
    getMerchants(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    viewMerchant(id: any): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    verifyMail(dto: VerifyMailDto): Promise<{
        message: string;
    }>;
    resetUserPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    userProfile(user: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateUserProfile(dto: UpdateUserProfileDto, reqUser: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    changeUserPassword(user: any, dto: ChangeUserPasswordDto): Promise<{
        success: boolean;
        msg: string;
    }>;
    changeStatus(dto: StatusMerchantDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, MerchantDocument, {}, {}> & Merchant & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    generateKeys(): Promise<{
        publicKey: any;
        privateKey: any;
        encryptedPublicKey: string;
        encryptedPrivateKey: string;
        decryptedPublicKey: string;
        decryptedPrivateKey: string;
    }>;
    generateHmacSignature(secretKey: any, data: any): Promise<any>;
    contractFetch(providerOrSigner: any): Promise<ethers.Contract>;
    merchantCount(): Promise<{
        message: string;
        count: number;
    }>;
    checkPassword(user: any, dto: checkPassword): Promise<{
        message: string;
        data: {
            privateKey: string;
            address: string;
        };
    }>;
}
