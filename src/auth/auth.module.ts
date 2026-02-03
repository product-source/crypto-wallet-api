import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { LocalStrategy } from "src/strategy/local.strategy";
import { Admin, AdminSchema } from "src/admin/schema/admin.schema";
import { AdminService } from "src/admin/admin.service";
import { ConfigService } from "src/config/config.service";
import { HashService } from "src/admin/hash.service";
import { JwtStrategy } from "src/strategy/jwt.strategy";
import { EmailModule } from "src/emails/email.module";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
      {
        name: Merchant.name,
        schema: MerchantSchema,
      },
    ]),
    JwtModule.register({
      secret: ConfigService.keys.JWT_SECRET,
      signOptions: {
        expiresIn: "30h",
        // expiresIn: "30s",
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    HashService,
    AdminService,
    JwtStrategy,
  ],
})
export class AuthModule {}
