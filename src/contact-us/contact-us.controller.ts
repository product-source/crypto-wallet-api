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
import { ContactUsService } from "./contact-us.service";
import { AddContactDto, UpdateContactDto } from "./dto/contact-us.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("contact-us")
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) { }

  @Post("add")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads/contact-us",
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    })
  )
  addContact(@Body() dto: AddContactDto, @UploadedFile() file: any) {
    return this.contactUsService.addContact(dto, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTACT_US)
  @Get("list")
  contactList(@Query() query) {
    return this.contactUsService.getContacts(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTACT_US)
  @Get("view")
  viewContact(@Query() query) {
    const { id } = query;
    return this.contactUsService.viewContact(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONTACT_US)
  @Post("update")
  updateContactt(@Body() dto: UpdateContactDto) {
    return this.contactUsService.updateConatact(dto);
  }
}
