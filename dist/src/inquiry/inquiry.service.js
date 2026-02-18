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
exports.InquiryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_service_1 = require("../emails/email.service");
const inquiry_schema_1 = require("./schema/inquiry.schema");
const bcrypt = __importStar(require("bcryptjs"));
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const notification_schema_1 = require("../notification/schema/notification.schema");
let InquiryService = class InquiryService {
    constructor(inquiryModel, merchantModel, notificationModel, emailService) {
        this.inquiryModel = inquiryModel;
        this.merchantModel = merchantModel;
        this.notificationModel = notificationModel;
        this.emailService = emailService;
    }
    async addInquiry(dto) {
        try {
            const { name, platformName, platformCategory, email, countryCode, contactNumber, location, description, } = dto;
            const emailExist = await this.inquiryModel.findOne({ email });
            if (emailExist) {
                throw new common_1.BadRequestException("This email is already present");
            }
            const model = await new this.inquiryModel();
            model.name = name.trim();
            model.platformName = platformName.trim();
            model.platformCategory = platformCategory.trim();
            model.email = email.trim();
            model.countryCode = countryCode.trim();
            model.contactNumber = contactNumber.trim();
            model.location = location.trim();
            model.description = description.trim();
            await model.save();
            return { message: "Inquiry added succesfully" };
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
    async getUsers(query) {
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
            queryObject["isAccountCreated"] = false;
            const users = await this.inquiryModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.inquiryModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "Inquiry List",
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
    async viewInquiry(id) {
        try {
            const user = await this.inquiryModel.findById(id);
            if (!user) {
                throw new common_1.NotFoundException("Invalid User Id");
            }
            return { message: "View Inquiry", user };
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
    async createAccount(dto) {
        try {
            const { id, name, platformName, platformCategory, email, countryCode, contactNumber, location, description, uniqueID, } = dto;
            const user = await this.inquiryModel.findById(id);
            if (!user) {
                throw new common_1.NotFoundException("Invalid User Id");
            }
            if (name)
                user.name = name.trim();
            if (email)
                user.email = email.trim();
            if (platformName)
                user.platformName = platformName.trim();
            if (platformCategory)
                user.platformCategory = platformCategory.trim();
            if (countryCode)
                user.countryCode = countryCode.trim();
            if (contactNumber)
                user.contactNumber = contactNumber.trim();
            if (location)
                user.location = location.trim();
            if (description)
                user.description = description.trim();
            try {
                const emailRecipient = user.email;
                const emailSubject = "Account Created Successfully";
                const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmation</title>
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
                      <p>Thank you for registering with us! We're excited to have you on board. Please find your registration details below:</p>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; font-size: 14px; color: #555555;">
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Email:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user?.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Password:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${uniqueID}</td>
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
                (user.isAccountCreated = true),
                    await user.save();
            }
            catch (emailError) {
                console.error("Failed to send email:", emailError);
                throw new common_1.BadRequestException("Failed to send email");
            }
            try {
                const newMerchant = new this.merchantModel({
                    inquiryId: user?._id,
                    name: user?.name,
                    platformName: user?.platformName,
                    platformCategory: user?.platformCategory,
                    email: user?.email,
                    countryCode: user?.countryCode,
                    contactNumber: user?.contactNumber,
                    location: user?.location,
                    description: user?.description,
                    password: await bcrypt.hash(uniqueID, 12),
                    isAccountCreated: true,
                });
                await newMerchant.save();
                const notificationModel = new this.notificationModel({
                    merchantId: newMerchant._id,
                    message: "Account Created Successfully",
                });
                await notificationModel.save();
                return {
                    message: "User updated and merchant created successfully",
                    data: newMerchant,
                };
            }
            catch (merchantError) {
                console.error("Failed to create merchant:", merchantError);
                throw new common_1.BadRequestException("Failed to create merchant");
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
    async inquiryCount() {
        try {
            const count = await this.inquiryModel.countDocuments({
                isAccountCreated: false,
            });
            return { message: "inquiry count", count: count };
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
exports.InquiryService = InquiryService;
exports.InquiryService = InquiryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(inquiry_schema_1.Inquiry.name)),
    __param(1, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        email_service_1.EmailService])
], InquiryService);
//# sourceMappingURL=inquiry.service.js.map