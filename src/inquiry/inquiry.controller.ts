import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { InquiryService } from "./inquiry.service";
import { AddInquiryDto, CreateInquiryDto } from "./dto/inquiry.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("inquiry")
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post("add")
  addInquiry(@Body() dto: AddInquiryDto) {
    return this.inquiryService.addInquiry(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INQUIRY_MANAGEMENT)
  @Get("list")
  usersList(@Query() query) {
    return this.inquiryService.getUsers(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INQUIRY_MANAGEMENT)
  @Get("view")
  viewInquiry(@Query() query) {
    const { id } = query;
    return this.inquiryService.viewInquiry(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INQUIRY_MANAGEMENT)
  @Post("create-account")
  createAccount(@Body() dto: CreateInquiryDto) {
    return this.inquiryService.createAccount(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INQUIRY_MANAGEMENT)
  @Get("count")
  inquiryCount() {
    return this.inquiryService.inquiryCount();
  }
}
