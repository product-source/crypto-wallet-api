import { Body, Controller, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { TestimonialService } from "./testimonial.service";
import { AddTestimonialDto, UpdateTestimonialDto } from "./dto/testimonial.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("testimonial")
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddTestimonialDto) {
    return this.testimonialService.addPage(dto);
  }

  @Get("list")
  list() {
    return this.testimonialService.pagesList();
  }

  @Get("view")
  viewPage(@Query() query) {
    const { id } = query;
    return this.testimonialService.viewPage(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Put("update")
  async updatePage(@Body() dto: UpdateTestimonialDto) {
    return this.testimonialService.updatePage(dto);
  }

  @Get("slug")
  slugPage(@Query() query) {
    const { slug } = query;
    return this.testimonialService.viewPageBySlug(slug);
  }
}
