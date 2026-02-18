"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const merchant_schema_1 = require("./schema/merchant.schema");
const uuid_1 = require("uuid");
const config_service_1 = require("../config/config.service");
const hash_service_1 = require("../admin/hash.service");
const email_service_1 = require("../emails/email.service");
const bcrypt = __importStar(require("bcryptjs"));
const ethers_1 = require("ethers");
const merchant_abi_service_1 = require("../utils/merchant.abi.service");
const encryption_service_1 = require("../utils/encryption.service");
const apps_schema_1 = require("../apps/schema/apps.schema");
const notification_schema_1 = require("../notification/schema/notification.schema");
const profile_updated_email_1 = require("../emails/templates/profile-updated.email");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
let MerchantsService = class MerchantsService {
    constructor(merchantModel, notificationModel, emailService, hashService, encryptionService, appsModel) {
        this.merchantModel = merchantModel;
        this.notificationModel = notificationModel;
        this.emailService = emailService;
        this.hashService = hashService;
        this.encryptionService = encryptionService;
        this.appsModel = appsModel;
    }
    async getMerchants(query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = {};
            if (search) {
                queryObject = {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { contactNumber: { $regex: search, $options: "i" } },
                    ],
                };
            }
            const users = await this.merchantModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.merchantModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "Merchant List",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                data: users,
            };
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
    async viewMerchant(id) {
        try {
            const user = await this.merchantModel.findById(id);
            if (!user) {
                throw new common_1.NotFoundException("Invalid User Id");
            }
            return { message: "View Merchant", user };
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
    async verifyMail(dto) {
        try {
            const { email } = dto;
            const user = await this.merchantModel.findOne({ email });
            if (!user) {
                throw new common_1.BadRequestException("Invalid email");
            }
            const token = (0, uuid_1.v4)();
            user.verificationToken = token;
            await user.save();
            const verificationUrl = `${config_service_1.ConfigService.keys.WEB_BASE_URL}reset-password?token=${token}`;
            const emailRecipient = user?.email;
            const emailSubject = "Reset Your Password";
            const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
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
                      <p>Please Reset password with this link:</p>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; font-size: 14px; color: #555555;">
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Link:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${verificationUrl}</td>
                        </tr>
                      </table>
                      <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
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
            return { message: "Email send at your mail id" };
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
    async resetUserPassword(dto) {
        try {
            const { verificationToken, newPassword, confirmPassword } = dto;
            const user = await this.merchantModel.findOne({
                verificationToken,
            });
            if (!user) {
                throw new common_1.BadRequestException("Invalid email");
            }
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException("Password and Confirm password must be same");
            }
            const saltOrRounds = 12;
            user.password = await bcrypt.hash(newPassword, saltOrRounds);
            user.verificationToken = null;
            await user.save();
            return { message: "Password reset successfully" };
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
    async userProfile(user) {
        try {
            const userInfo = await this.merchantModel.findById(user.userId).select({
                _id: 1,
                email: 1,
                name: 1,
                countryCode: 1,
                contactNumber: 1,
                platformName: 1,
                platformCategory: 1,
                location: 1,
                description: 1,
                isMFA: 1,
                isNotification: 1,
                createdAt: 1,
                totalFiatBalance: 1,
                isGoogle2FA: 1,
                isIPWhitelistEnabled: 1,
                whitelistedIPs: 1,
            });
            if (!userInfo) {
                throw new common_1.NotAcceptableException("User doesn't exist");
            }
            return { message: "User profile", data: userInfo };
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
    async updateUserProfile(dto, reqUser) {
        try {
            console.log("dtoooooooooooo", reqUser, dto);
            const { id, name, countryCode, contactNumber, location, description, isMFA, isNotification, isAccountSuspend, isIPWhitelistEnabled, whitelistedIPs, } = dto;
            const user = await this.merchantModel.findById(id);
            if (!user) {
                throw new common_1.NotAcceptableException("User doesn't exist");
            }
            if (name)
                user.name = name.trim();
            if (countryCode)
                user.countryCode = countryCode;
            if (contactNumber)
                user.contactNumber = contactNumber;
            if (location)
                user.location = location.trim();
            if (description)
                user.description = description.trim();
            if (reqUser.isAdmin) {
                user.isAccountSuspend = isAccountSuspend;
            }
            if (isIPWhitelistEnabled !== undefined) {
                if (isIPWhitelistEnabled && (!whitelistedIPs || whitelistedIPs.length === 0)) {
                    throw new common_1.BadRequestException("At least one IP address is required when enabling IP Whitelist");
                }
                user.isIPWhitelistEnabled = isIPWhitelistEnabled;
            }
            if (whitelistedIPs !== undefined) {
                user.whitelistedIPs = whitelistedIPs;
            }
            user.isNotification = isNotification;
            user.isMFA = isMFA;
            try {
                const emailRecipient = user.email;
                const emailSubject = "Profile Updated Successfully";
                await this.emailService.sendEmail(emailRecipient, emailSubject, (0, profile_updated_email_1.profileUpdateTemplate)(user));
                await user.save();
            }
            catch (emailError) {
                console.error("Failed to send email:", emailError);
                throw new common_1.BadRequestException("Failed to send email");
            }
            return { message: "Updated successfully", data: user };
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
    async changeUserPassword(user, dto) {
        try {
            const { currentPassword, newPassword, confirmPassword } = dto;
            const userInfo = await this.merchantModel.findById(user.userId);
            if (!userInfo) {
                throw new common_1.NotAcceptableException("User doesn't exist");
            }
            const matchPassword = await this.hashService.comparePassword(currentPassword, userInfo.password);
            if (!matchPassword) {
                throw new common_1.NotAcceptableException("Current password not matched");
            }
            if (newPassword !== confirmPassword) {
                throw new common_1.NotAcceptableException("New password not matched with confirm password");
            }
            userInfo.password = await bcrypt.hash(newPassword, 12);
            await userInfo.save();
            const notificationModel = new this.notificationModel({
                merchantId: userInfo._id,
                message: "Password changed successfully",
            });
            await notificationModel.save();
            try {
                const emailRecipient = userInfo?.email;
                const emailSubject = "Password changed successfully";
                const emailHtml = `
       <!DOCTYPE html>
       <html>
       
       <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Password Changed</title>
       </head>
       
       <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
         <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; padding: 20px;">
           <tr>
             <td align="center">
               <table cellpadding="0" cellspacing="0" border="0" width="600"
                 style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
                 <!-- Logo -->
                 <tr>
                   <td align="center" style="padding: 20px; background-color: #ffffff;">
                     <img src="https://crypto-wallet-api.devtechnosys.tech/logo/logo.png" alt="Company Logo"
                       style="max-width: 200px; height: auto;">
                   </td>
                 </tr>
                 <!-- Header -->
                 <tr>
                   <td align="center"
                     style="background-color: #000; padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
                     Thank You for Contacting Us
                   </td>
                 </tr>
                 <!-- Body -->
                 <tr>
                   <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                     <p>Hi ${userInfo?.name},</p>
                     <p>Your password has been successfully changed. Please log in to your account with these
                       credentials:\n
       
                       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; font-size: 14px; color: #555555;">
                               <tr>
                                 <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Email:</td>
                                 <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${userInfo?.email}</td>
                               </tr>
                               <tr>
                                 <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Password:</td>
                                 <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${newPassword}</td>
                               </tr>
                               
                             </table>
                     <p>If you need immediate assistance, feel free to contact us directly.</p>
                     <p>Best regards,<br>The Coinpera Company Team</p>
                   </td>
                 </tr>
                 <!-- Footer -->
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
            return {
                success: true,
                msg: "password changed successfully",
            };
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
    async changeStatus(dto) {
        try {
            const { id, isActive } = dto;
            const user = await this.merchantModel.findById(id);
            if (!user) {
                throw new common_1.NotFoundException("Invalid User Id");
            }
            await user.save();
            return { message: "Merchant status Updated succesfully", data: user };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.NotAcceptableException(error);
            }
        }
    }
    async generateKeys() {
        try {
            const publicKey = crypto.randomBytes(48).toString("base64url");
            const privateKey = crypto.randomBytes(48).toString("base64url");
            if (publicKey === privateKey) {
                throw new common_1.NotAcceptableException("Both keys are same");
            }
            if (!publicKey || !privateKey) {
                throw new common_1.NotAcceptableException("Keys not generated properly");
            }
            const encryptedPublicKey = await this.encryptionService.encryptData(publicKey);
            const encryptedPrivateKey = await this.encryptionService.encryptData(privateKey);
            const decryptedPublicKey = await this.encryptionService.decryptData(encryptedPublicKey);
            const decryptedPrivateKey = await this.encryptionService.decryptData(encryptedPrivateKey);
            return {
                publicKey: publicKey,
                privateKey: privateKey,
                encryptedPublicKey: encryptedPublicKey,
                encryptedPrivateKey: encryptedPrivateKey,
                decryptedPublicKey: decryptedPublicKey,
                decryptedPrivateKey: decryptedPrivateKey,
            };
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
    async generateHmacSignature(secretKey, data) {
        const hmac = CryptoJS.HmacSHA512(data, secretKey);
        return hmac.toString(CryptoJS.enc.Hex);
    }
    async contractFetch(providerOrSigner) {
        const contract = await new ethers_1.ethers.Contract(process.env.MERCHANT_CONTRACT_ADDRESS, merchant_abi_service_1.ABI, providerOrSigner);
        return contract;
    }
    async merchantCount() {
        try {
            const count = await this.merchantModel.countDocuments();
            return { message: "merchant count", count: count };
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
    async checkPassword(user, dto) {
        try {
            const userInfo = await this.merchantModel.findById(user.userId);
            if (!userInfo) {
                throw new common_1.NotAcceptableException("Merchant doesn't exist");
            }
            const matchPassword = await this.hashService.comparePassword(dto.password, userInfo.password);
            if (!matchPassword) {
                throw new common_1.NotAcceptableException("password not matched");
            }
            const chainId = dto.chainId;
            const walletField = chainId === "BTC"
                ? "BtcWalletMnemonic"
                : chainId === "TRON"
                    ? "TronWalletMnemonic"
                    : "EVMWalletMnemonic";
            const userWalletInfo = await this.appsModel
                .findOne({ _id: dto.appId, merchantId: user.userId })
                .select(`_id ${walletField}`);
            if (!userWalletInfo) {
                throw new common_1.NotAcceptableException("Apps doesn't exist");
            }
            const address = userWalletInfo?.[walletField]?.address;
            const privateKey = this.encryptionService.decryptData(userWalletInfo?.[walletField]?.privateKey);
            return {
                message: `User wallet info for chain id : ${chainId}`,
                data: {
                    privateKey: privateKey,
                    address: address,
                },
            };
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
};
exports.MerchantsService = MerchantsService;
exports.MerchantsService = MerchantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __param(1, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(5, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        email_service_1.EmailService,
        hash_service_1.HashService,
        encryption_service_1.EncryptionService,
        mongoose_2.Model])
], MerchantsService);
//# sourceMappingURL=merchants.service.js.map