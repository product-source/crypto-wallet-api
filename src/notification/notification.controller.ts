import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { SendNotificationDto } from "./dto/notification.dto";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("notification")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get("get")
  authNotifications(@Request() req, @Query() query) {
    const { user } = req;
    return this.notificationService.getAuthNotifications(user, query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.NOTIFICATION)
  @Get("list")
  notificationList(@Query() query) {
    return this.notificationService.notificationList(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.NOTIFICATION)
  @Post("send")
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.NOTIFICATION)
  @Delete("delete/:id")
  deleteNotification(@Param("id") id: string) {
    return this.notificationService.deleteNotification(id);
  }
}
