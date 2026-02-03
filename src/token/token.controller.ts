import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Query,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { TokenService } from "./token.service";
import { AddTokenDto, UpdateMinWithdrawDto } from "./dto/token.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@UseGuards(JwtAuthGuard)
@Controller("token")
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.WALLET_MANAGEMENT)
  @Post("add")
  addPage(@Body() dto: AddTokenDto) {
    return this.tokenService.addToken(dto);
  }

  @Get("list")
  getToken(@Query() query) {
    return this.tokenService.getTokens(query);
  }

  @Get("getById")
  getTokenById(@Query() query) {
    return this.tokenService.tokenById(query);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.WALLET_MANAGEMENT)
  @Post("update-min-withdraw")
  updateMinWithdraw(@Body() dto: UpdateMinWithdrawDto, @Request() req) {
    const { user } = req;
    return this.tokenService.updateMinWithdraw(dto, user);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.WALLET_MANAGEMENT)
  @Delete("delete")
  deleteToken(@Query() query) {
    return this.tokenService.deleteToken(query);
  }

  @Get("validate-tron-address")
  getValidateTronAddress(@Query() query) {
    return this.tokenService.getValidateTronAddress(query);
  }
}
