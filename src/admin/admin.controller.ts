import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Put,
  Query,
  Delete,
} from "@nestjs/common";

import {
  AdminSignupDto,
  AdminUpdateProfileDto,
  ChangePasswordDto,
  PlatformFeeDto,
  ResetPasswordDto,
  verifyMailDto,
  CreateAdminDto,
  UpdateAdminRoleDto,
  AdminListQueryDto,
} from "./dto/admin.dto";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { Role } from "src/auth/enums/role.enum";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("register")
  registerAdmin(@Body() dto: AdminSignupDto) {
    return this.adminService.registerAdmin(dto);
  }

  @Post("verify-mail")
  verifyMail(@Body() dto: verifyMailDto) {
    return this.adminService.verifyMail(dto);
  }

  @Post("reset-password")
  changePassword(@Body() dto: ResetPasswordDto) {
    return this.adminService.resetPassword(dto);
  }

  @Post("change-password")
  resetPassword(@Body() dto: ChangePasswordDto) {
    return this.adminService.changedPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async adminProfile(@Request() req) {
    const { user } = req;
    return this.adminService.adminProfile(user);
  }

  @Put("update-profile")
  updateProfile(@Body() dto: AdminUpdateProfileDto) {
    return this.adminService.updateProfile(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put("update-platform-fee")
  updatePlatformFee(@Body() dto: PlatformFeeDto, @Request() req) {
    const { user } = req;
    return this.adminService.updatePlatformFee(dto, user);
  }

  @Get("get-platform-fee")
  getPlatformFee() {
    return this.adminService.getPlatformFee();
  }

  @UseGuards(JwtAuthGuard)
  @Post("verify-admin-token")
  verifyAdmin(@Request() req) {
    const { user } = req;
    return this.adminService.verifyAdmin(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post("create")
  createAdmin(@Body() dto: CreateAdminDto, @Request() req) {
    const { user } = req;
    return this.adminService.createAdmin(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put("update-role")
  updateAdminRole(@Body() dto: UpdateAdminRoleDto, @Request() req) {
    const { user } = req;
    return this.adminService.updateAdminRole(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get("list")
  getAdminList(@Query() query: AdminListQueryDto) {
    return this.adminService.getAdminList(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete("delete")
  deleteAdmin(@Query("id") id: string, @Request() req) {
    const { user } = req;
    return this.adminService.deleteAdmin(id, user);
  }
}
