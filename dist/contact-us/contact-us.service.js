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
exports.ContactUsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const contact_us_schema_1 = require("./schema/contact-us.schema");
const email_service_1 = require("../emails/email.service");
const pricing_schema_1 = require("../pricing/schema/pricing.schema");
let ContactUsService = class ContactUsService {
    constructor(contactModel, pricingModel, emailService) {
        this.contactModel = contactModel;
        this.pricingModel = pricingModel;
        this.emailService = emailService;
    }
    async addContact(dto, file) {
        try {
            console.log("dtoooo", dto);
            const { name, email, countryCode, contactNumber, description, pricingId, } = dto;
            const model = await new this.contactModel();
            model.name = name.trim();
            model.email = email.trim();
            model.countryCode = countryCode.trim();
            model.contactNumber = contactNumber.trim();
            model.description = description.trim();
            model.pricingId = pricingId;
            if (file) {
                model.image = `uploads/contact-us/${file.filename}`;
            }
            await model.save();
            try {
                const emailRecipient = "newsletter@coinpera.com";
                const emailSubject = "New Contact Us Submission";
                const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Us Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; padding: 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background-color: #000; padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
                      New Contact Us Submission
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                      <p>Hello Admin,</p>
                      <p>You have received a new contact inquiry. Below are the details:</p>
                      <ul style="list-style-type: none; padding: 0;">
                        <li><strong>Name:</strong> ${model?.name}</li>
                        <li><strong>Email:</strong> ${model?.email}</li>
                        <li><strong>Contact Number:</strong> ${model?.countryCode + model?.contactNumber}</li>
                        <li><strong>Description:</strong> ${model?.description}</li>
                         ${model.image
                    ? `<li><strong>Attachment:</strong> <a href="${process.env.BASE_URL}${model.image}" target="_blank">View Image</a></li>`
                    : ""}
                      </ul>
                      <p>Please review this inquiry and take necessary action.</p>
                      <p>Best regards,<br>Your System</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #999999;">
                      &copy; ${new Date().getFullYear()} Coinpera. All rights reserved.
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
            catch (error) {
                if (error instanceof common_1.NotFoundException) {
                    throw error;
                }
                else {
                    console.log("An error occurred:", error.message);
                    throw new common_1.BadRequestException(error);
                }
            }
            return { message: "Added succesfully" };
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
    async getContacts(query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = {
                status: "PENDING",
            };
            if (search) {
                queryObject = {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { contactNumber: { $regex: search, $options: "i" } },
                    ],
                };
            }
            const users = await this.contactModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.contactModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "Contact List",
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
    async viewContact(id) {
        try {
            const user = await this.contactModel.findById(id);
            if (!user) {
                throw new common_1.NotFoundException("Invalid Conatct Id");
            }
            let pricingData;
            if (user.pricingId) {
                pricingData = await this.pricingModel.findOne({ _id: user.pricingId });
            }
            return { message: "View Conatct", user, pricingData };
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
    async updateConatact(dto) {
        try {
            const { id, adminReply } = dto;
            const contact = await this.contactModel.findById(id);
            if (!contact) {
                throw new common_1.NotFoundException("Invalid Conatct Id");
            }
            if (contact?.status === "REPLIED") {
                throw new common_1.BadRequestException("Can not reply again");
            }
            try {
                if (adminReply) {
                    contact.adminReply = adminReply.trim();
                    contact.status = "REPLIED";
                    const emailRecipient = contact?.email;
                    const emailSubject = "Thanks for Connecting us";
                    const emailHtml = `
          <!DOCTYPE html>
            <html>
              <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; padding: 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 20px; background-color: #ffffff;">
              <img src="https://crypto-wallet-api.devtechnosys.tech/logo/logo.png" alt="Company Logo" style="max-width: 200px; height: auto;">
            </td>
          </tr>
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #000; padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
              Thank You for Contacting Us
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
              <p>Hi ${contact?.name},</p>
              <p>Thank you for reaching out to us! We've received your message and .<br>
              Here is the feedback from our admin:</p>

               ${adminReply}:</p>
              
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
                    await contact.save();
                    return { message: "Updated succesfully", data: contact };
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
exports.ContactUsService = ContactUsService;
exports.ContactUsService = ContactUsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(contact_us_schema_1.ContactUs.name)),
    __param(1, (0, mongoose_1.InjectModel)(pricing_schema_1.Pricing.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        email_service_1.EmailService])
], ContactUsService);
//# sourceMappingURL=contact-us.service.js.map