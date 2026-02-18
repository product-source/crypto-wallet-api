import { Role, Permission } from "src/auth/enums/role.enum";
export declare class AdminSignupDto {
    name: string;
    email: string;
    password: string;
    countryCode: string;
    contactNumber: string;
}
export declare class AdminLoginDto {
    email: string;
    password: string;
}
export declare class verifyMailDto {
    email: string;
}
export declare class ResetPasswordDto {
    verificationToken: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class ChangePasswordDto {
    id: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class AdminUpdateProfileDto {
    id: string;
    name: string;
    email: string;
    countryCode: string;
    contactNumber: string;
}
export declare class PlatformFeeDto {
    platformFee: number;
    merchantFee: number;
    adminWallet: string;
    tronPlatformFee: number;
    tronMerchantFee: number;
    tronAdminWallet: string;
    btcPlatformFee: number;
    btcMerchantFee: number;
    btcAdminWallet: string;
}
export declare class UpdateFiatWalletDto {
    FiatEvmAdminWallet: string;
    FiatTronAdminWallet: string;
    FiatbtcAdminWallet: string;
}
export declare class CreateAdminDto {
    name: string;
    email: string;
    password: string;
    countryCode: string;
    contactNumber: string;
    role: Role;
    permissions: Permission[];
}
export declare class UpdateAdminRoleDto {
    adminId: string;
    role: Role;
    permissions: Permission[];
}
export declare class AdminListQueryDto {
    search: string;
    page: string;
    limit: string;
}
