import { AuthService } from "./auth.service";
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AdminLoginDto } from "src/admin/dto/admin.dto";
import { MerchantLoginDto, MerchantOTPDto, Verify2FaDto, Disable2FaDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post("login")
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post("merchant-login")
  async merchantLogin(@Body() dto: MerchantLoginDto) {
    return this.authService.merchantLogin(dto);
  }

  @Post("merchant-otp-verify")
  async verifyMerchantOTP(@Body() dto: MerchantOTPDto) {
    return this.authService.verifyMerchantOTP(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/generate")
  async generate2FA(@Request() req) {
    return this.authService.generate2FASecret(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/verify")
  async verify2FA(@Request() req, @Body() dto: Verify2FaDto) {
    return this.authService.verifyAndEnable2FA(req.user.userId, dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable")
  async disable2FA(@Request() req, @Body() dto: Disable2FaDto) {
    return this.authService.disable2FA(req.user.userId, dto.password);
  }
}
