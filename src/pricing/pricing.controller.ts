import { Body, Controller, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { PricingService } from "./pricing.service";
import { AddPricingPageDto, UpdatePricingPageDto } from "./dto/pricing.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddPricingPageDto) {
    return this.pricingService.addPage(dto);
  }

  @Get("list")
  list() {
    return this.pricingService.pagesList();
  }

  @Get("view")
  viewPage(@Query() query) {
    const { id } = query;
    return this.pricingService.viewPage(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Put("update")
  async updatePage(@Body() dto: UpdatePricingPageDto) {
    return this.pricingService.updatePage(dto);
  }

  @Get("slug")
  slugPage(@Query() query) {
    const { slug } = query;
    return this.pricingService.viewPageBySlug(slug);
  }
}
