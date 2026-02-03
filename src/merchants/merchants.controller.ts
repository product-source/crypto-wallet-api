import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { MerchantsService } from "./merchants.service";
import {
  ChangeUserPasswordDto,
  checkPassword,
  HelloDto,
  ResetPasswordDto,
  StatusMerchantDto,
  UpdateUserProfileDto,
  VerifyMailDto,
} from "./dto/merchant.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("merchants")
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Get("list")
  merchantList(@Query() query) {
    return this.merchantsService.getMerchants(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Get("view")
  viewMerchant(@Query() query) {
    const { id } = query;
    return this.merchantsService.viewMerchant(id);
  }

  @Post("verify-user-mail")
  verifyUserMail(@Body() dto: VerifyMailDto) {
    return this.merchantsService.verifyMail(dto);
  }

  @Post("reset-password")
  resetUserPassword(@Body() dto: ResetPasswordDto) {
    return this.merchantsService.resetUserPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("user-profile")
  async userProfile(@Request() req) {
    const { user } = req;
    return this.merchantsService.userProfile(user);
  }

  
  @UseGuards(JwtAuthGuard)
  @Put("update-user-profile")
  updateProfile(@Body() dto: UpdateUserProfileDto, @Request() req) {
    const reqUser = req?.user;
    return this.merchantsService.updateUserProfile(dto, reqUser);
  }

  @UseGuards(JwtAuthGuard)
  @Put("change-user-password")
  changePassword(@Request() req, @Body() dto: ChangeUserPasswordDto) {
    const { user } = req;
    return this.merchantsService.changeUserPassword(user, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Post("change-status")
  changeStatus(@Body() dto: StatusMerchantDto) {
    return this.merchantsService.changeStatus(dto);
  }

  @Get("generate-keys")
  generateKey() {
    return this.merchantsService.generateKeys();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Get("count")
  merchantCount() {
    return this.merchantsService.merchantCount();
  }

  @UseGuards(JwtAuthGuard)
  @Post("check-password")
  async userPassword(@Request() req, @Body() dto: checkPassword) {
    const { user } = req;
    return this.merchantsService.checkPassword(user, dto);
  }
}
