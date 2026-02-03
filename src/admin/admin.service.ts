import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import { validate } from "bitcoin-address-validation";
import { Model } from "mongoose";
import { AdminDocument, Admin } from "./schema/admin.schema";
import {
  AdminSignupDto,
  ChangePasswordDto,
  verifyMailDto,
  AdminUpdateProfileDto,
  ResetPasswordDto,
  PlatformFeeDto,
  CreateAdminDto,
  UpdateAdminRoleDto,
  AdminListQueryDto,
} from "./dto/admin.dto";
import { Role } from "src/auth/enums/role.enum";
import * as fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "src/emails/email.service";
import { ConfigService } from "src/config/config.service";
import { isValidEVMAddress } from "src/helpers/evm.helper";
import { isValidTronAddress } from "src/helpers/tron.helper";
import { join } from "path";

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly emailService: EmailService
  ) { }

  async ensureDefaultAdminExist() {
    const tokenCount = await this.adminModel.countDocuments();

    if (tokenCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.admins.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const adminData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.adminModel.insertMany(adminData);
      console.log("Default admin inserted successfully.......................");
    }
  }

  async getUserEmail(email: string) {
    return this.adminModel.findOne({
      email,
    });
  }

  async registerAdmin(dto: AdminSignupDto) {
    try {
      const saltOrRounds = 12;
      const password = await bcrypt.hash(dto.password, saltOrRounds);
      const { email } = dto;

      const emailExist = await this.adminModel.findOne({ email: email });
      if (emailExist) {
        throw new NotAcceptableException(
          "This Email is exist with another account"
        );
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new InternalServerErrorException(error);
      }
    }
  }

  async verifyMail(dto: verifyMailDto) {
    try {
      const { email } = dto;
      const admin = await this.adminModel.findOne({ email });
      if (!admin) {
        throw new BadRequestException("Invalid email address provided");
      }
      // Generating a unique token
      const token = uuidv4();
      admin.verificationToken = token;
      await admin.save();
      // const verificationUrl = `http://localhost:3004/reset-password?token=${token}`;

      const verificationUrl = `${ConfigService.keys.Admin_BASE_URL}reset-password?token=${token}`;

      // const verificationUrl = `http://localhost:3004/reset-password/${token}`;

      //sending mail
      const emailRecipient = admin?.email;
      const emailSubject = "Reset Your Password";
      // const emailBody = `Dear ${admin?.name},\n\n Please Reset password with this link  ${verificationUrl}
      // \n\nThank you.`;

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
      await this.emailService.sendEmail(
        emailRecipient,
        emailSubject,
        emailHtml
      );

      return { message: "Email send at your mail id" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const { verificationToken, newPassword, confirmPassword } = dto;
      const admin = await this.adminModel.findOne({ verificationToken });
      if (!admin) {
        throw new BadRequestException("Link expired, Try again");
      }
      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          "Password and Confirm password must be same"
        );
      }
      const saltOrRounds = 12;
      admin.password = await bcrypt.hash(newPassword, saltOrRounds);
      admin.verificationToken = null;
      await admin.save();
      return { message: "Password reset successfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async changedPassword(dto: ChangePasswordDto) {
    try {
      const { id, currentPassword, newPassword, confirmPassword } = dto;
      const admin = await this.adminModel.findById(id);
      if (!admin) {
        throw new BadRequestException("Invalid customer id");
      }
      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          "Password and Confirm password must be same"
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        throw new BadRequestException("Invalid current password");
      }

      const saltOrRounds = 12;
      admin.password = await bcrypt.hash(newPassword, saltOrRounds);
      await admin.save();
      return { message: "Password changed successfully" };
    } catch (error) {
      throw error;
    }
  }

  async adminProfile(user: any) {
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
        throw new NotAcceptableException("Admin doesn't exist");
      }
      return { message: "Admin profile", data: adminInfo };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new InternalServerErrorException(error);
      }
    }
  }

  async updateProfile(dto: AdminUpdateProfileDto) {
    try {
      const { id, name, email, countryCode, contactNumber } = dto;
      const admin = await this.adminModel.findById(id);

      if (!admin) {
        throw new NotAcceptableException("Admin doesn't exist");
      }
      if (name) admin.name = name.trim();
      if (email) admin.email = email.trim();
      if (countryCode) admin.countryCode = countryCode;
      if (contactNumber) admin.contactNumber = contactNumber;

      await admin.save();
      return { message: "Updated successfully", data: admin };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new InternalServerErrorException(error);
      }
    }
  }

  async updatePlatformFee(dto: PlatformFeeDto, user) {
    try {
      const {
        platformFee,
        merchantFee,
        adminWallet,
        tronPlatformFee,
        tronMerchantFee,
        tronAdminWallet,
        btcPlatformFee,
        btcMerchantFee,
        btcAdminWallet,
      } = dto;
      if (user && !user?.isAdmin) {
        throw new ForbiddenException(
          "Unauthorized access, Admin privilege required"
        );
      }
      const admin = await this.adminModel.findOne();
      if (!admin) {
        return new NotFoundException("Admin not found");
      }

      if (platformFee) admin.platformFee = platformFee;
      if (merchantFee) admin.merchantFee = merchantFee;
      if (adminWallet) {
        if (!(await isValidEVMAddress(adminWallet))) {
          return new NotFoundException("Invalid EVM wallet address");
        } else {
          admin.adminWallet = adminWallet;
        }
      }

      if (tronPlatformFee) admin.tronPlatformFee = tronPlatformFee;
      if (tronMerchantFee) admin.tronMerchantFee = tronMerchantFee;
      if (tronAdminWallet) {
        if (await isValidTronAddress(tronAdminWallet)) {
          admin.tronAdminWallet = tronAdminWallet;
        } else {
          return new NotFoundException("Invalid Tron wallet address");
        }
      }

      if (btcPlatformFee) admin.btcPlatformFee = btcPlatformFee;
      if (btcMerchantFee) admin.btcMerchantFee = btcMerchantFee;
      if (btcAdminWallet) {
        if (validate(btcAdminWallet)) {
          admin.btcAdminWallet = btcAdminWallet;
        } else {
          return new NotFoundException("Invalid BTC wallet address");
        }
      }

      await admin.save();

      return {
        message: "Platform fee updated successfully",
        data: admin,
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

  async getPlatformFee() {
    try {
      const admin = await this.adminModel.findOne();

      if (!admin) {
        return new NotFoundException("Admin not found");
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async verifyAdmin(user) {
    try {
      if (user && !user?.isAdmin) {
        throw new ForbiddenException(
          "Unauthorized access, Admin privilege required"
        );
      }
      return {
        user,
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

  async createAdmin(dto: CreateAdminDto, currentUser: any) {
    try {
      const { email, password, name, countryCode, contactNumber, role, permissions } = dto;

      const emailExist = await this.adminModel.findOne({ email });
      if (emailExist) {
        throw new NotAcceptableException("This email already exists");
      }

      const saltOrRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltOrRounds);

      const admin = await this.adminModel.create({
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        password: hashedPassword,
        countryCode,
        contactNumber,
        role: role || Role.SUB_ADMIN,
        permissions: role === Role.SUPER_ADMIN ? [] : (permissions || []),
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
    } catch (error) {
      if (error instanceof NotAcceptableException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateAdminRole(dto: UpdateAdminRoleDto, currentUser: any) {
    try {
      const { adminId, role, permissions } = dto;

      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        throw new NotFoundException("Admin not found");
      }

      if (admin._id.toString() === currentUser.userId) {
        throw new ForbiddenException("You cannot change your own role");
      }

      admin.role = role;
      admin.permissions = role === Role.SUPER_ADMIN ? [] : (permissions || []);
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
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAdminList(query: AdminListQueryDto) {
    try {
      const { search, page = "1", limit = "10" } = query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
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
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteAdmin(adminId: string, currentUser: any) {
    try {
      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        throw new NotFoundException("Admin not found");
      }

      if (admin._id.toString() === currentUser.userId) {
        throw new ForbiddenException("You cannot delete yourself");
      }

      await this.adminModel.findByIdAndDelete(adminId);
      return { message: "Admin deleted successfully" };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
