
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { authenticator } from 'otplib';
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdminService } from "src/admin/admin.service";
import { AdminLoginDto } from "src/admin/dto/admin.dto";
import { HashService } from "src/admin/hash.service";
import { AdminDocument, Admin } from "src/admin/schema/admin.schema";
import { MerchantLoginDto, MerchantOTPDto } from "./dto/login.dto";
import {
  Merchant,
  MerchantDocument,
} from "src/merchants/schema/merchant.schema";
import { betweenRandomNumber } from "src/helpers/helper";
import { EmailService } from "src/emails/email.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private adminService: AdminService,
    private hashService: HashService,
    private readonly emailService: EmailService,
    private jwtService: JwtService,
    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<MerchantDocument>
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.adminService.getUserEmail(email);
    if (user && (await this.hashService.comparePassword(pass, user.password))) {
      return user;
    }
    return null;
  }

  // Admin Login
  async adminLogin(dto: AdminLoginDto) {
    try {
      const { email, password } = dto;
      const userToken = await this.adminModel.findOne({ email: email });

      if (!userToken) {
        throw new BadRequestException("Invalid email or password");
      }
      const passwordValid = await this.hashService.comparePassword(
        password,
        userToken.password
      );

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
      } else {
        throw new BadRequestException("Invalid email or password");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new InternalServerErrorException(error);
      }

      // throw error;
    }
  }

  async merchantLogin(dto: MerchantLoginDto) {
    try {
      const email = dto.email.toLowerCase();
      const { password, acceptTermsConditions } = dto;
      const user = await this.merchantModel
        .findOne({ email })
        .select("+password");

      if (!user) {
        throw new BadRequestException("Invalid email or password");
      }

      const passwordValid = await this.hashService.comparePassword(
        password,
        user.password
      );

      if (user.isAccountSuspend) {
        throw new UnauthorizedException("Your account is suspended.");
      }

      if (user && passwordValid && user.isAccountCreated === true) {
        if (user.isMFA) {
          // send otp
          const otp = betweenRandomNumber(100000, 999999);

          user.otp = otp;
          user.otpExpire = Date.now() + 600000; // 10 minutes

          try {
            // Sending mail
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
            await this.emailService.sendEmail(
              emailRecipient,
              emailSubject,
              emailHtml
            );
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
            throw new BadRequestException("Failed to send email");
          }

          await user.save();

          const response: any = {
            success: true,
            msg: "OTP sent to register email address",
            requires_2fa: true,
            "2fa_type": "email",
          };

          if (user.isGoogle2FA) {
            response.next_2fa_type = "google_auth";
          }

          return response;
        } else if (user.isGoogle2FA) {
          return {
            success: true,
            msg: "Please enter your 2FA code",
            requires_2fa: true,
            "2fa_type": "google_auth",
          };
        } else {
          // direct login
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
      } else {
        throw new BadRequestException("Invalid email or password");
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

  async verifyMerchantOTP(dto: MerchantOTPDto) {
    try {
      const { email, otp } = dto;
      const user = await this.merchantModel.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } }).select("+twoFactorSecret");

      if (!user) {
        throw new BadRequestException("Invalid email");
      }

      if (!user.isAccountCreated) {
        throw new BadRequestException("Account not created");
      }

      // Scenario A: Verifying Email OTP (isMFA)
      if (user.otp && Number(user.otp) === Number(otp)) {
        if (user.otpExpire === undefined || user.otpExpire < Date.now()) {
          throw new BadRequestException("OTP expired");
        }

        // Clear Email OTP
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save(); // Save clearing of OTP immediately

        // Check if Google 2FA is ALSO enabled (Sequential Flow)
        if (user.isGoogle2FA) {
          return {
            success: true,
            msg: "Email verified. Please enter Google Authenticator code.",
            step2_required: true,
            "2fa_type": "google_auth",
          };
        } else {
          // Login Complete (Only Email OTP was required)
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

      // Scenario B: Verifying Google Auth OTP (isGoogle2FA)
      // If we reach here, it means either:
      // 1. Email OTP didn't match (user inputted Google Code)
      // 2. Email OTP was already cleared (user is in Step 2)
      // 3. User doesn't have Email OTP enabled (direct Google Auth)

      if (user.isGoogle2FA) {
        if (!user.twoFactorSecret) {
          throw new BadRequestException("2FA secret not found");
        }

        let isValid = false;
        try {
          isValid = authenticator.check(String(otp), user.twoFactorSecret);
        } catch (e) {
          isValid = false;
        }

        if (isValid) {
          // Google Auth Successful -> Login Complete
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

      // If neither matched
      throw new BadRequestException("Invalid otp");

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async generate2FASecret(userId: string) {
    const user = await this.merchantModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Generates a new TOTP secret
    const secret = authenticator.generateSecret();
    const otpauth_url = authenticator.keyuri(user.email, 'Paycoinz', secret);

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

  async verifyAndEnable2FA(userId: string, token: string) {
    const user = await this.merchantModel.findById(userId).select("+twoFactorSecret");
    if (!user) throw new NotFoundException('User not found');

    if (!user.twoFactorSecret) {
      throw new BadRequestException("No 2FA secret generated. Please generate one first.");
    }

    let isValid = false;
    try {
      isValid = authenticator.check(token, user.twoFactorSecret);
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      throw new BadRequestException("Invalid OTP code");
    }

    user.isGoogle2FA = true;
    // user.isMFA = false; // logic prioritization handles it, keeping isMFA as backup or independent flag

    await user.save();

    return {
      success: true,
      msg: "2FA enabled successfully"
    };
  }

  async disable2FA(userId: string, password?: string) {
    const user = await this.merchantModel.findById(userId).select("+password");
    if (!user) throw new NotFoundException('User not found');

    if (password) {
      const passwordValid = await this.hashService.comparePassword(password, user.password);
      if (!passwordValid) {
        throw new BadRequestException("Invalid password");
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
}
