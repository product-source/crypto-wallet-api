import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Token, TokenSchema } from "./schema/token.schema";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Token.name, schema: TokenSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
