import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { AddFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}


  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FAQ_MANAGEMENT)
  @Post("add")
  addFaq(@Body() dto: AddFaqDto) {
    return this.faqService.addFaq(dto);
  }

  @Get("list")
  list() {
    return this.faqService.faqList();
  }

  @Get("view")
  viewFaq(@Query() query) {
    const { id } = query;
    return this.faqService.viewFaq(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FAQ_MANAGEMENT)
  @Put("update")
  updateFaq(@Body() dto: UpdateFaqDto) {
    return this.faqService.updateFaq(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FAQ_MANAGEMENT)
  @Post("delete")
  deleteFaq(@Query() query) {
    const { id } = query;
    return this.faqService.deleteFaq(id);
  }
}
