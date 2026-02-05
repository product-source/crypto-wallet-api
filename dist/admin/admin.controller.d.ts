import { AdminSignupDto, AdminUpdateProfileDto, ChangePasswordDto, PlatformFeeDto, ResetPasswordDto, verifyMailDto, CreateAdminDto, UpdateAdminRoleDto, AdminListQueryDto } from "./dto/admin.dto";
import { AdminService } from "./admin.service";
import { Role } from "src/auth/enums/role.enum";
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    registerAdmin(dto: AdminSignupDto): Promise<{
        message: string;
    }>;
    verifyMail(dto: verifyMailDto): Promise<{
        message: string;
    }>;
    changePassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    adminProfile(req: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/admin.schema").AdminDocument, {}, {}> & import("./schema/admin.schema").Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateProfile(dto: AdminUpdateProfileDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/admin.schema").AdminDocument, {}, {}> & import("./schema/admin.schema").Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updatePlatformFee(dto: PlatformFeeDto, req: any): Promise<import("@nestjs/common").NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/admin.schema").AdminDocument, {}, {}> & import("./schema/admin.schema").Admin & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getPlatformFee(): Promise<import("@nestjs/common").NotFoundException | {
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
        };
    }>;
    verifyAdmin(req: any): Promise<{
        user: any;
    }>;
    createAdmin(dto: CreateAdminDto, req: any): Promise<{
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            email: string;
            role: Role;
            permissions: import("src/auth/enums/role.enum").Permission[];
        };
    }>;
    updateAdminRole(dto: UpdateAdminRoleDto, req: any): Promise<{
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
        data: (import("mongoose").Document<unknown, {}, import("./schema/admin.schema").AdminDocument, {}, {}> & import("./schema/admin.schema").Admin & Document & {
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
    deleteAdmin(id: string, req: any): Promise<{
        message: string;
    }>;
}
