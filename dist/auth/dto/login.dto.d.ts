export declare class MerchantLoginDto {
    email: string;
    password: string;
    acceptTermsConditions: string;
}
export declare class MerchantOTPDto {
    email: string;
    otp: any;
}
export declare class Verify2FaDto {
    token: string;
}
export declare class Disable2FaDto {
    password?: string;
}
