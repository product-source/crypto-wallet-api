"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const otplib_1 = require("otplib");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin_service_1 = require("../admin/admin.service");
const hash_service_1 = require("../admin/hash.service");
const admin_schema_1 = require("../admin/schema/admin.schema");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const helper_1 = require("../helpers/helper");
const email_service_1 = require("../emails/email.service");
let AuthService = class AuthService {
    constructor(adminModel, adminService, hashService, emailService, jwtService, merchantModel) {
        this.adminModel = adminModel;
        this.adminService = adminService;
        this.hashService = hashService;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.merchantModel = merchantModel;
    }
    async validateUser(email, pass) {
        const user = await this.adminService.getUserEmail(email);
        if (user && (await this.hashService.comparePassword(pass, user.password))) {
            return user;
        }
        return null;
    }
    async adminLogin(dto) {
        try {
            const { email, password } = dto;
            const userToken = await this.adminModel.findOne({ email: email });
            if (!userToken) {
                throw new common_1.BadRequestException("Invalid email or password");
            }
            const passwordValid = await this.hashService.comparePassword(password, userToken.password);
            if (userToken && passwordValid) {
                const payload = {
                    email: userToken.email,
                    userId: userToken._id,
                    isAdmin: true,
                };
                const accessToken = this.jwtService.sign(payload);
                return {
                    sucess: true,
                    msg: "Login succesfully",
                    access_token: accessToken,
                };
            }
            else {
                throw new common_1.BadRequestException("Invalid email or password");
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.InternalServerErrorException(error);
            }
        }
    }
    async merchantLogin(dto) {
        try {
            const email = dto.email.toLowerCase();
            const { password, acceptTermsConditions } = dto;
            const user = await this.merchantModel
                .findOne({ email })
                .select("+password");
            if (!user) {
                throw new common_1.BadRequestException("Invalid email or password");
            }
            const passwordValid = await this.hashService.comparePassword(password, user.password);
            if (user.isAccountSuspend) {
                throw new common_1.UnauthorizedException("Your account is suspended.");
            }
            if (user && passwordValid && user.isAccountCreated === true) {
                if (user.isMFA) {
                    const otp = (0, helper_1.betweenRandomNumber)(100000, 999999);
                    user.otp = otp;
                    user.otpExpire = Date.now() + 600000;
                    try {
                        const emailRecipient = user.email;
                        const emailSubject = "Verify your otp";
                        const emailHtml = `
              <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>OTP Verify</title>
                  </head>
                  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; padding: 20px;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
                            <tr>
                              <td align="center" style="padding: 20px; background-color: #ffffff;">
                                <img src="https://crypto-wallet-api.devtechnosys.tech/logo/logo.png" alt="Company Logo" style="max-width: 200px; height: auto;">
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style="background-color: #000; padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
                                Welcome to Our Service
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                <p>Hi ${user?.name},</p>
                                <p>Please use the following One-Time Password (OTP) to verify your account:</p>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; font-size: 14px; color: #555555;">
                                <tr>
                                  <td colspan="2" style="padding: 0; border-bottom: none;">
                                    <div style="border: 2px solid #000; padding: 15px; margin: 10px 0; font-size: 18px; font-weight: bold; text-align: center;">
                                      <span style="display: inline-block; padding: 10px; font-size: 24px; font-weight: bold;">OTP:</span>
                                      <span style="display: inline-block; padding: 10px; font-size: 24px;">${otp}</span>
                                    </div>
                                  </td>
                                </tr>
                                </table>
                                <p>This OTP is valid for a limited time. If you did not request this, please ignore this email.</p>
                                <p>Best regards,<br>The Coinpera Team</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #999999;">
                                &copy; ${new Date().getFullYear()} Coinpera. All rights reserved.<br>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>`;
                        await this.emailService.sendEmail(emailRecipient, emailSubject, emailHtml);
                    }
                    catch (emailError) {
                        console.error("Failed to send email:", emailError);
                        throw new common_1.BadRequestException("Failed to send email");
                    }
                    await user.save();
                    const response = {
                        success: true,
                        msg: "OTP sent to register email address",
                        requires_2fa: true,
                        "2fa_type": "email",
                    };
                    if (user.isGoogle2FA) {
                        response.next_2fa_type = "google_auth";
                    }
                    return response;
                }
                else if (user.isGoogle2FA) {
                    return {
                        success: true,
                        msg: "Please enter your 2FA code",
                        requires_2fa: true,
                        "2fa_type": "google_auth",
                    };
                }
                else {
                    const payload = {
                        email: user.email,
                        userId: user._id,
                    };
                    const accessToken = this.jwtService.sign(payload);
                    await user.save();
                    return {
                        success: true,
                        msg: "Login succesfully",
                        access_token: accessToken,
                    };
                }
            }
            else {
                throw new common_1.BadRequestException("Invalid email or password");
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async verifyMerchantOTP(dto) {
        try {
            const { email, otp } = dto;
            const user = await this.merchantModel.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } }).select("+twoFactorSecret");
            if (!user) {
                throw new common_1.BadRequestException("Invalid email");
            }
            if (!user.isAccountCreated) {
                throw new common_1.BadRequestException("Account not created");
            }
            if (user.otp && Number(user.otp) === Number(otp)) {
                if (user.otpExpire === undefined || user.otpExpire < Date.now()) {
                    throw new common_1.BadRequestException("OTP expired");
                }
                user.otp = undefined;
                user.otpExpire = undefined;
                await user.save();
                if (user.isGoogle2FA) {
                    return {
                        success: true,
                        msg: "Email verified. Please enter Google Authenticator code.",
                        step2_required: true,
                        "2fa_type": "google_auth",
                    };
                }
                else {
                    const payload = {
                        email: user.email,
                        userId: user._id,
                    };
                    const accessToken = this.jwtService.sign(payload);
                    return {
                        success: true,
                        msg: "Login succesfully",
                        access_token: accessToken,
                    };
                }
            }
            if (user.isGoogle2FA) {
                if (!user.twoFactorSecret) {
                    throw new common_1.BadRequestException("2FA secret not found");
                }
                let isValid = false;
                try {
                    isValid = otplib_1.authenticator.check(String(otp), user.twoFactorSecret);
                }
                catch (e) {
                    isValid = false;
                }
                if (isValid) {
                    const payload = {
                        email: user.email,
                        userId: user._id,
                    };
                    const accessToken = this.jwtService.sign(payload);
                    return {
                        success: true,
                        msg: "Login succesfully",
                        access_token: accessToken,
                    };
                }
            }
            throw new common_1.BadRequestException("Invalid otp");
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async generate2FASecret(userId) {
        const user = await this.merchantModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const secret = otplib_1.authenticator.generateSecret();
        const otpauth_url = otplib_1.authenticator.keyuri(user.email, 'Paycoinz', secret);
        user.twoFactorSecret = secret;
        await user.save();
        return {
            success: true,
            data: {
                secret,
                otpauth_url
            }
        };
    }
    async verifyAndEnable2FA(userId, token) {
        const user = await this.merchantModel.findById(userId).select("+twoFactorSecret");
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.twoFactorSecret) {
            throw new common_1.BadRequestException("No 2FA secret generated. Please generate one first.");
        }
        let isValid = false;
        try {
            isValid = otplib_1.authenticator.check(token, user.twoFactorSecret);
        }
        catch (e) {
            isValid = false;
        }
        if (!isValid) {
            throw new common_1.BadRequestException("Invalid OTP code");
        }
        user.isGoogle2FA = true;
        await user.save();
        return {
            success: true,
            msg: "2FA enabled successfully"
        };
    }
    async disable2FA(userId, password) {
        const user = await this.merchantModel.findById(userId).select("+password");
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (password) {
            const passwordValid = await this.hashService.comparePassword(password, user.password);
            if (!passwordValid) {
                throw new common_1.BadRequestException("Invalid password");
            }
        }
        user.isGoogle2FA = false;
        user.twoFactorSecret = undefined;
        await user.save();
        return {
            success: true,
            msg: "2FA disabled successfully"
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(5, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        admin_service_1.AdminService,
        hash_service_1.HashService,
        email_service_1.EmailService,
        jwt_1.JwtService,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map