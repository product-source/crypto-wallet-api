import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { AppsService } from "./apps.service";
import { AppListDto, CreateAppsDto, UpdateAppsDto } from "./dto/apps.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";
import { UpdateWebhookDto, GetWebhookLogsDto } from "src/webhook/dto/webhook.dto";
import { WebhookService } from "src/webhook/webhook.service";

@Controller("apps")
export class AppsController {
  constructor(
    private readonly appsService: AppsService,
    private readonly webhookService: WebhookService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post("add")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: "./uploads/apps",
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
          return cb(
            new BadRequestException(
              "Only image files (jpg, jpeg, png) are allowed!"
            ),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    })
  )
  addApp(
    @Request() req,
    @Body() dto: CreateAppsDto,
    @UploadedFile() file: any
  ) {
    const { user } = req;
    return this.appsService.addApp(user, dto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get("get")
  getApp(@Request() req, @Query() query) {
    const { user } = req;
    return this.appsService.getApps(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("getById")
  getAppById(@Request() req, @Query() query) {
    const { user } = req;
    return this.appsService.appById(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("keys")
  getKeys(@Request() req, @Query() query) {
    const { user } = req;
    return this.appsService.getKeys(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Put("update")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: "./uploads/apps",
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
          return cb(
            new BadRequestException(
              "Only image files (jpg, jpeg, png) are allowed!"
            ),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    })
  )
  updateApp(
    @Request() req,
    @Query() query,
    @Body() dto: UpdateAppsDto,
    @UploadedFile() file: any
  ) {
    const { user } = req;
    return this.appsService.updateApp(user, query, dto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("delete")
  deleteApp(@Request() req, @Query() query) {
    const { user } = req;
    return this.appsService.deleteApp(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("unread-notification-count")
  getUnreadNotificationCount(@Request() req) {
    const { user } = req;
    return this.appsService.getUnreadNotificationCount(user);
  }

  //admin pannel

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Get("list")
  appList(@Query() query) {
    return this.appsService.appList(query);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.MERCHANT_MANAGEMENT)
  @Get("view")
  viewMerchantApp(@Query() query) {
    const { id } = query;
    return this.appsService.viewMerchantApp(id);
  }

  // Webhook endpoints - API Key authentication (no JWT required)
  @Post("webhook/update")
  updateWebhook(@Body() dto: UpdateWebhookDto) {
    return this.appsService.updateWebhookWithApiKey(dto);
  }

  @Post("webhook/logs")
  getWebhookLogs(@Body() dto: GetWebhookLogsDto) {
    return this.appsService.getWebhookLogsWithApiKey(dto);
  }
}
