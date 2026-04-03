export declare class CreateAppsDto {
    name: string;
    description: string;
    theme: string;
    toleranceMargin: number;
}
export declare class UpdateAppsDto {
    name: string;
    description: string;
    theme: string;
    removeLogo: string;
    toleranceMargin: number;
}
export declare class AppListDto {
    merchantId: string;
}
export declare class RequestWhitelistOtpDto {
    appId: string;
}
export declare class AddWhitelistDto {
    appId: string;
    address: string;
    label: string;
    network: string;
    otp: string;
}
export declare class RemoveWhitelistDto {
    appId: string;
    address: string;
    otp: string;
}
