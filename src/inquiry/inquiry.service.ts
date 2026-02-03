import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmailService } from "src/emails/email.service";
import { AddInquiryDto, CreateInquiryDto } from "./dto/inquiry.dto";
import { Inquiry, InquiryDocument } from "./schema/inquiry.schema";
import * as bcrypt from "bcryptjs";
import { HashService } from "src/admin/hash.service";
import {
  Merchant,
  MerchantDocument,
} from "src/merchants/schema/merchant.schema";
import {
  Notification,
  NotificationDocument,
} from "src/notification/schema/notification.schema";
import { EncryptionService } from "src/utils/encryption.service";

@Injectable()
export class InquiryService {
  constructor(
    @InjectModel(Inquiry.name)
    private readonly inquiryModel: Model<InquiryDocument>,
    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<MerchantDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly emailService: EmailService
  ) { }

  async addInquiry(dto: AddInquiryDto) {
    try {
      const {
        name,
        platformName,
        platformCategory,
        email,
        countryCode,
        contactNumber,
        location,
        description,
      } = dto;
      const emailExist = await this.inquiryModel.findOne({ email });
      if (emailExist) {
        throw new BadRequestException("This email is already present");
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async viewInquiry(id) {
    try {
      const user = await this.inquiryModel.findById(id);
      if (!user) {
        throw new NotFoundException("Invalid User Id");
      }
      return { message: "View Inquiry", user };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async createAccount(dto: CreateInquiryDto) {
    try {
      const {
        id,
        name,
        platformName,
        platformCategory,
        email,
        countryCode,
        contactNumber,
        location,
        description,
        uniqueID,
      } = dto;
      const user = await this.inquiryModel.findById(id);
      if (!user) {
        throw new NotFoundException("Invalid User Id");
      }
      if (name) user.name = name.trim();
      if (email) user.email = email.trim();
      if (platformName) user.platformName = platformName.trim();
      if (platformCategory) user.platformCategory = platformCategory.trim();
      if (countryCode) user.countryCode = countryCode.trim();
      if (contactNumber) user.contactNumber = contactNumber.trim();
      if (location) user.location = location.trim();
      if (description) user.description = description.trim();

      try {
        // Sending mail
        const emailRecipient = user.email;
        const emailSubject = "Account Created Successfully";
        // const emailBody = `Dear ${user.name},\n\nYour account has been created successfully. Please log in to your account with these credentials:\nEmail: ${user.email}\nPassword: ${uniqueID}\n\nThank you.`;
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
        await this.emailService.sendEmail(
          emailRecipient,
          emailSubject,
          emailHtml
        );

        (user.isAccountCreated = true),
          // Save the updated user
          await user.save();
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        throw new BadRequestException("Failed to send email");
      }

      try {
        // Move inquiry model data to merchant model

        // //generating Mnemonic
        // const generate = generateMnemonic();
        // if (!generate) {
        //   throw new NotAcceptableException("Error in generating Mnemonic");
        // }

        // // generate evm wallet
        // const walletInfo = generateEvmWallet(generate, 0);
        // if (!walletInfo) {
        //   throw new NotAcceptableException("Error in generating Evm wallet");
        // }

        // const encryptedAddress = this.encryptionService.encryptData(
        //   walletInfo.address
        // );
        // const encryptedPrivateKey = this.encryptionService.encryptData(
        //   walletInfo.privateKey
        // );

        // const encryptedMnemonicPhrase = this.encryptionService.encryptData(
        //   walletInfo.mnemonic.phrase
        // );
        // const encryptedMnemonicPath = this.encryptionService.encryptData(
        //   walletInfo.mnemonic.path
        // );
        // const encryptedMnemonicLocale = this.encryptionService.encryptData(
        //   walletInfo.mnemonic.locale
        // );

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
          password: await bcrypt.hash(uniqueID, 12), // hashed password
          isAccountCreated: true,

          // //index no
          // currentIndexVal: walletInfo?.index,

          // //adding public, private, mneomic, MerchantId

          // // merchantId: uuidv4(),
          // EVMWalletMnemonic: {
          //   address: encryptedAddress,
          //   privateKey: encryptedPrivateKey,
          //   mnemonic: {
          //     phrase: encryptedMnemonicPhrase,
          //     path: encryptedMnemonicPath,
          //     locale: encryptedMnemonicLocale,
          //   },
          // },
        });

        // Save the new merchant
        await newMerchant.save();

        // saving notification
        const notificationModel = new this.notificationModel({
          merchantId: newMerchant._id,
          message: "Account Created Successfully",
        });
        await notificationModel.save();

        return {
          message: "User updated and merchant created successfully",
          data: newMerchant,
        };
      } catch (merchantError) {
        console.error("Failed to create merchant:", merchantError);
        throw new BadRequestException("Failed to create merchant");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async inquiryCount() {
    try {
      const count = await this.inquiryModel.countDocuments({
        isAccountCreated: false,
      });
      return { message: "inquiry count", count: count };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
}
