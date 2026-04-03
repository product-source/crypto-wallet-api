import { AuthService } from "./auth.service";
import { AdminLoginDto } from "src/admin/dto/admin.dto";
import { MerchantLoginDto, MerchantOTPDto, Verify2FaDto, Disable2FaDto } from "./dto/login.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    adminLogin(dto: AdminLoginDto): Promise<{
        sucess: boolean;
        msg: string;
        access_token: string;
    }>;
    merchantLogin(dto: MerchantLoginDto): Promise<any>;
    verifyMerchantOTP(dto: MerchantOTPDto): Promise<{
        success: boolean;
        msg: string;
        step2_required: boolean;
        "2fa_type": string;
        access_token?: undefined;
    } | {
        success: boolean;
        msg: string;
        access_token: string;
        step2_required?: undefined;
        "2fa_type"?: undefined;
    }>;
    generate2FA(req: any): Promise<{
        success: boolean;
        data: {
            secret: string;
            otpauth_url: string;
        };
    }>;
    verify2FA(req: any, dto: Verify2FaDto): Promise<{
        success: boolean;
        msg: string;
    }>;
    disable2FA(req: any, dto: Disable2FaDto): Promise<{
        success: boolean;
        msg: string;
    }>;
}
