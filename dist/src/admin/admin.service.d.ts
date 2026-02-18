import { NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { AdminDocument, Admin } from "./schema/admin.schema";
import { AdminSignupDto, ChangePasswordDto, verifyMailDto, AdminUpdateProfileDto, ResetPasswordDto, PlatformFeeDto, CreateAdminDto, UpdateAdminRoleDto, AdminListQueryDto, UpdateFiatWalletDto } from "./dto/admin.dto";
import { Role } from "src/auth/enums/role.enum";
import { EmailService } from "src/emails/email.service";
export declare class AdminService {
    private readonly adminModel;
    private readonly emailService;
    constructor(adminModel: Model<AdminDocument>, emailService: EmailService);
    ensureDefaultAdminExist(): Promise<void>;
    getUserEmail(email: string): Promise<import("mongoose").Document<unknown, {}, AdminDocument, {}, {}> & Admin & Document & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    registerAdmin(dto: AdminSignupDto): Promise<{
        message: string;
    }>;
    verifyMail(dto: verifyMailDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changedPassword(dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    adminProfile(user: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, AdminDocument, {}, {}> & Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateProfile(dto: AdminUpdateProfileDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, AdminDocument, {}, {}> & Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePlatformFee(dto: PlatformFeeDto, user: any): Promise<NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, AdminDocument, {}, {}> & Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateFiatWallet(dto: UpdateFiatWalletDto, user: any): Promise<NotFoundException | {
        message: string;
        data: {
            FiatEvmAdminWallet: string;
            FiatTronAdminWallet: string;
            FiatbtcAdminWallet: string;
        };
    }>;
    getPlatformFee(): Promise<NotFoundException | {
        data: {
            platformFee: number;
            feeUnit: string;
            adminWallet: string;
            merchantFee: number;
            merchantFeeWallet: string;
            tronPlatformFee: number;
            tronMerchantFee: number;
            tronAdminWallet: string;
            btcPlatformFee: number;
            btcMerchantFee: number;
            btcAdminWallet: string;
            FiatEvmAdminWallet: string;
            FiatTronAdminWallet: string;
            FiatbtcAdminWallet: string;
        };
    }>;
    verifyAdmin(user: any): Promise<{
        user: any;
    }>;
    createAdmin(dto: CreateAdminDto, currentUser: any): Promise<{
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            email: string;
            role: Role;
            permissions: import("src/auth/enums/role.enum").Permission[];
        };
    }>;
    updateAdminRole(dto: UpdateAdminRoleDto, currentUser: any): Promise<{
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            email: string;
            role: Role;
            permissions: import("src/auth/enums/role.enum").Permission[];
        };
    }>;
    getAdminList(query: AdminListQueryDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, AdminDocument, {}, {}> & Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    deleteAdmin(adminId: string, currentUser: any): Promise<{
        message: string;
    }>;
}
