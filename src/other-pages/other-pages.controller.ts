import { Body, Controller, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { OtherPagesService } from "./other-pages.service";
import { AddOtherPageDto, UpdateOtherPageDto } from "./dto/other-pages.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("other-pages")
export class OtherPagesController {
  constructor(private readonly otherPagesService: OtherPagesService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddOtherPageDto) {
    return this.otherPagesService.addPage(dto);
  }

  @Get("list")
  list() {
    return this.otherPagesService.pagesList();
  }

  @Get("view")
  viewPage(@Query() query) {
    const { id } = query;
    return this.otherPagesService.viewPage(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Put("update-api")
  async updatePage(@Body() dto: UpdateOtherPageDto) {
    return this.otherPagesService.updateAPICard(dto);
  }

  @Get("slug")
  slugPage(@Query() query) {
    const { slug } = query;
    return this.otherPagesService.viewPageBySlug(slug);
  }

  @Get("apis")
  viewAPIs() {
    return this.otherPagesService.viewApis();
  }
}
