import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import { AdminService } from "src/admin/admin.service";
import { AdminLoginDto } from "src/admin/dto/admin.dto";
import { HashService } from "src/admin/hash.service";
import { AdminDocument } from "src/admin/schema/admin.schema";
import { MerchantLoginDto, MerchantOTPDto } from "./dto/login.dto";
import { MerchantDocument } from "src/merchants/schema/merchant.schema";
import { EmailService } from "src/emails/email.service";
export declare class AuthService {
    private adminModel;
    private adminService;
    private hashService;
    private readonly emailService;
    private jwtService;
    private readonly merchantModel;
    constructor(adminModel: Model<AdminDocument>, adminService: AdminService, hashService: HashService, emailService: EmailService, jwtService: JwtService, merchantModel: Model<MerchantDocument>);
    validateUser(email: string, pass: string): Promise<any>;
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
    generate2FASecret(userId: string): Promise<{
        success: boolean;
        data: {
            secret: string;
            otpauth_url: string;
        };
    }>;
    verifyAndEnable2FA(userId: string, token: string): Promise<{
        success: boolean;
        msg: string;
    }>;
    disable2FA(userId: string, password?: string): Promise<{
        success: boolean;
        msg: string;
    }>;
}
