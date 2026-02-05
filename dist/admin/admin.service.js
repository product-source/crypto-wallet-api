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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const bitcoin_address_validation_1 = require("bitcoin-address-validation");
const mongoose_2 = require("mongoose");
const admin_schema_1 = require("./schema/admin.schema");
const role_enum_1 = require("../auth/enums/role.enum");
const fs = __importStar(require("fs/promises"));
const uuid_1 = require("uuid");
const email_service_1 = require("../emails/email.service");
const config_service_1 = require("../config/config.service");
const evm_helper_1 = require("../helpers/evm.helper");
const tron_helper_1 = require("../helpers/tron.helper");
const path_1 = require("path");
let AdminService = class AdminService {
    constructor(adminModel, emailService) {
        this.adminModel = adminModel;
        this.emailService = emailService;
    }
    async ensureDefaultAdminExist() {
        const tokenCount = await this.adminModel.countDocuments();
        if (tokenCount === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "coinpera-web.admins.json");
            const fileContent = await fs.readFile(filePath, "utf8");
            const rawTokensData = JSON.parse(fileContent);
            const adminData = rawTokensData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
            await this.adminModel.insertMany(adminData);
            console.log("Default admin inserted successfully.......................");
        }
    }
    async getUserEmail(email) {
        return this.adminModel.findOne({
            email,
        });
    }
    async registerAdmin(dto) {
        try {
            const saltOrRounds = 12;
            const password = await bcrypt.hash(dto.password, saltOrRounds);
            const { email } = dto;
            const emailExist = await this.adminModel.findOne({ email: email });
            if (emailExist) {
                throw new common_1.NotAcceptableException("This Email is exist with another account");
            }
            const admin = await this.adminModel.create({
                name: dto?.name,
                email,
                password,
                countryCode: dto?.countryCode,
                contactNumber: dto?.contactNumber,
            });
            await admin.save();
            return { message: "Admin has added successfully" };
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
    async verifyMail(dto) {
        try {
            const { email } = dto;
            const admin = await this.adminModel.findOne({ email });
            if (!admin) {
                throw new common_1.BadRequestException("Invalid email address provided");
            }
            const token = (0, uuid_1.v4)();
            admin.verificationToken = token;
            await admin.save();
            const verificationUrl = `${config_service_1.ConfigService.keys.Admin_BASE_URL}reset-password?token=${token}`;
            const emailRecipient = admin?.email;
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
                    <p>Hi ${admin?.name},</p>
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
    async resetPassword(dto) {
        try {
            const { verificationToken, newPassword, confirmPassword } = dto;
            const admin = await this.adminModel.findOne({ verificationToken });
            if (!admin) {
                throw new common_1.BadRequestException("Link expired, Try again");
            }
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException("Password and Confirm password must be same");
            }
            const saltOrRounds = 12;
            admin.password = await bcrypt.hash(newPassword, saltOrRounds);
            admin.verificationToken = null;
            await admin.save();
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
    async changedPassword(dto) {
        try {
            const { id, currentPassword, newPassword, confirmPassword } = dto;
            const admin = await this.adminModel.findById(id);
            if (!admin) {
                throw new common_1.BadRequestException("Invalid customer id");
            }
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException("Password and Confirm password must be same");
            }
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                throw new common_1.BadRequestException("Invalid current password");
            }
            const saltOrRounds = 12;
            admin.password = await bcrypt.hash(newPassword, saltOrRounds);
            await admin.save();
            return { message: "Password changed successfully" };
        }
        catch (error) {
            throw error;
        }
    }
    async adminProfile(user) {
        try {
            const adminInfo = await this.adminModel.findById(user?.userId).select({
                _id: 1,
                email: 1,
                name: 1,
                countryCode: 1,
                contactNumber: 1,
                role: 1,
                permissions: 1,
            });
            if (!adminInfo) {
                throw new common_1.NotAcceptableException("Admin doesn't exist");
            }
            return { message: "Admin profile", data: adminInfo };
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
    async updateProfile(dto) {
        try {
            const { id, name, email, countryCode, contactNumber } = dto;
            const admin = await this.adminModel.findById(id);
            if (!admin) {
                throw new common_1.NotAcceptableException("Admin doesn't exist");
            }
            if (name)
                admin.name = name.trim();
            if (email)
                admin.email = email.trim();
            if (countryCode)
                admin.countryCode = countryCode;
            if (contactNumber)
                admin.contactNumber = contactNumber;
            await admin.save();
            return { message: "Updated successfully", data: admin };
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
    async updatePlatformFee(dto, user) {
        try {
            const { platformFee, merchantFee, adminWallet, tronPlatformFee, tronMerchantFee, tronAdminWallet, btcPlatformFee, btcMerchantFee, btcAdminWallet, } = dto;
            if (user && !user?.isAdmin) {
                throw new common_1.ForbiddenException("Unauthorized access, Admin privilege required");
            }
            const admin = await this.adminModel.findOne();
            if (!admin) {
                return new common_1.NotFoundException("Admin not found");
            }
            if (platformFee)
                admin.platformFee = platformFee;
            if (merchantFee)
                admin.merchantFee = merchantFee;
            if (adminWallet) {
                if (!(await (0, evm_helper_1.isValidEVMAddress)(adminWallet))) {
                    return new common_1.NotFoundException("Invalid EVM wallet address");
                }
                else {
                    admin.adminWallet = adminWallet;
                }
            }
            if (tronPlatformFee)
                admin.tronPlatformFee = tronPlatformFee;
            if (tronMerchantFee)
                admin.tronMerchantFee = tronMerchantFee;
            if (tronAdminWallet) {
                if (await (0, tron_helper_1.isValidTronAddress)(tronAdminWallet)) {
                    admin.tronAdminWallet = tronAdminWallet;
                }
                else {
                    return new common_1.NotFoundException("Invalid Tron wallet address");
                }
            }
            if (btcPlatformFee)
                admin.btcPlatformFee = btcPlatformFee;
            if (btcMerchantFee)
                admin.btcMerchantFee = btcMerchantFee;
            if (btcAdminWallet) {
                if ((0, bitcoin_address_validation_1.validate)(btcAdminWallet)) {
                    admin.btcAdminWallet = btcAdminWallet;
                }
                else {
                    return new common_1.NotFoundException("Invalid BTC wallet address");
                }
            }
            await admin.save();
            return {
                message: "Platform fee updated successfully",
                data: admin,
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
    async getPlatformFee() {
        try {
            const admin = await this.adminModel.findOne();
            if (!admin) {
                return new common_1.NotFoundException("Admin not found");
            }
            return {
                data: {
                    platformFee: admin.platformFee,
                    feeUnit: "percent",
                    adminWallet: admin.adminWallet,
                    merchantFee: admin.merchantFee,
                    merchantFeeWallet: admin.adminWallet,
                    tronPlatformFee: admin.tronPlatformFee,
                    tronMerchantFee: admin.tronMerchantFee,
                    tronAdminWallet: admin.tronAdminWallet,
                    btcPlatformFee: admin.btcPlatformFee,
                    btcMerchantFee: admin.btcMerchantFee,
                    btcAdminWallet: admin.btcAdminWallet,
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
    async verifyAdmin(user) {
        try {
            if (user && !user?.isAdmin) {
                throw new common_1.ForbiddenException("Unauthorized access, Admin privilege required");
            }
            return {
                user,
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
    async createAdmin(dto, currentUser) {
        try {
            const { email, password, name, countryCode, contactNumber, role, permissions } = dto;
            const emailExist = await this.adminModel.findOne({ email });
            if (emailExist) {
                throw new common_1.NotAcceptableException("This email already exists");
            }
            const saltOrRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltOrRounds);
            const admin = await this.adminModel.create({
                name: name?.trim(),
                email: email?.trim().toLowerCase(),
                password: hashedPassword,
                countryCode,
                contactNumber,
                role: role || role_enum_1.Role.SUB_ADMIN,
                permissions: role === role_enum_1.Role.SUPER_ADMIN ? [] : (permissions || []),
            });
            await admin.save();
            return {
                message: "Admin created successfully",
                data: {
                    _id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.NotAcceptableException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async updateAdminRole(dto, currentUser) {
        try {
            const { adminId, role, permissions } = dto;
            const admin = await this.adminModel.findById(adminId);
            if (!admin) {
                throw new common_1.NotFoundException("Admin not found");
            }
            if (admin._id.toString() === currentUser.userId) {
                throw new common_1.ForbiddenException("You cannot change your own role");
            }
            admin.role = role;
            admin.permissions = role === role_enum_1.Role.SUPER_ADMIN ? [] : (permissions || []);
            await admin.save();
            return {
                message: "Admin role updated successfully",
                data: {
                    _id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getAdminList(query) {
        try {
            const { search, page = "1", limit = "10" } = query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const filter = {};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ];
            }
            const [admins, total] = await Promise.all([
                this.adminModel
                    .find(filter)
                    .select({ password: 0, verificationToken: 0, adminPrivateKey: 0 })
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ createdAt: -1 }),
                this.adminModel.countDocuments(filter),
            ]);
            return {
                message: "Admin list fetched successfully",
                data: admins,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async deleteAdmin(adminId, currentUser) {
        try {
            const admin = await this.adminModel.findById(adminId);
            if (!admin) {
                throw new common_1.NotFoundException("Admin not found");
            }
            if (admin._id.toString() === currentUser.userId) {
                throw new common_1.ForbiddenException("You cannot delete yourself");
            }
            await this.adminModel.findByIdAndDelete(adminId);
            return { message: "Admin deleted successfully" };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        email_service_1.EmailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map