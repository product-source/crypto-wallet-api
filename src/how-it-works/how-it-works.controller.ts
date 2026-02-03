import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { HowItWorksService } from './how-it-works.service';
import { AddHowItWorksPageDto, UpdateHowItWorksPageDto } from './dto/how-it-works.dto';
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller('how-it-works')
export class HowItWorksController {
  constructor(private readonly howItWorksService: HowItWorksService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddHowItWorksPageDto) {
    return this.howItWorksService.addPage(dto);
  }

  @Get("list")
  list() {
    return this.howItWorksService.pagesList();
  }

  @Get("view")
  viewPage(@Query() query) {
    const { id } = query;
    return this.howItWorksService.viewPage(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Put("update")
  async updatePage(@Body() dto: UpdateHowItWorksPageDto) {
    return this.howItWorksService.updatePage(dto);
  }

  @Get("slug")
  slugPage(@Query() query) {
    const { slug } = query;
    return this.howItWorksService.viewPageBySlug(slug);
  }
}
