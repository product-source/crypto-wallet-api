import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { NetworkService } from "./network.service";
import { AddNetworkDto } from "./dto/network.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("network")
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.WALLET_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddNetworkDto) {
    return this.networkService.addNetwork(dto);
  }
}
