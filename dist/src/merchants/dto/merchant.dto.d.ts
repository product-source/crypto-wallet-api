export declare class VerifyMailDto {
    email: string;
}
export declare class ResetPasswordDto {
    verificationToken: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class UpdateUserProfileDto {
    id: string;
    isAccountSuspend: boolean;
    name: string;
    platformName: string;
    platformCategory: string;
    countryCode: string;
    contactNumber: string;
    email: string;
    location: string;
    description: string;
    isMFA: boolean;
    isNotification: boolean;
    isIPWhitelistEnabled: boolean;
    whitelistedIPs: string[];
}
export declare class ChangeUserPasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class StatusMerchantDto {
    id: string;
    isActive: boolean;
}
export declare class HelloDto {
    hmac: any;
    privateKey: string;
    currency: string;
    version: string;
    cmd: string;
    key: string;
    format: string;
}
export declare class checkPassword {
    password: string;
    appId: string;
    chainId: string;
}
