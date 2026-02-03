import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { PagesService } from "./pages.service";
import { AddPageDto, UpdatePageDto } from "./dto/pages.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddPageDto) {
    return this.pagesService.addPage(dto);
  }

  @Get("list")
  list() {
    return this.pagesService.pagesList();
  }

  @Get("view")
  viewPage(@Query() query) {
    const { id } = query;
    return this.pagesService.viewPage(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Put("update")
  async updatePage(@Body() dto: UpdatePageDto) {
    return this.pagesService.updatePage(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTENT_MANAGEMENT)
  @Post("file-upload")
  @UseInterceptors(FileInterceptor("image", { storage }))
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    try {
      return this.pagesService.uploadFile(image);
    } catch (error) {
      console.error("Error uploading image:", error);
      // throw new InternalServerErrorException("Error uploading image: " + error.message);
    }
  }

  @Get("slug")
  slugPage(@Query() query) {
    const { slug } = query;
    return this.pagesService.viewPageBySlug(slug);
  }
}
