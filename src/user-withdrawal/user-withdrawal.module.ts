import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserWithdrawalController } from "./user-withdrawal.controller";
import { UserWithdrawalService } from "./user-withdrawal.service";
import {
    UserWithdrawal,
    UserWithdrawalSchema,
} from "./schema/user-withdrawal.schema";
import { Apps, AppsSchema } from "src/apps/schema/apps.schema";
import { Token, TokenSchema } from "src/token/schema/token.schema";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { WebhookModule } from "src/webhook/webhook.module";
import { ApiKeyAuthGuard } from "src/auth/guards/api-key-auth.guard";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserWithdrawal.name, schema: UserWithdrawalSchema },
            { name: Apps.name, schema: AppsSchema },
            { name: Token.name, schema: TokenSchema },
            { name: Merchant.name, schema: MerchantSchema },
        ]),
        WebhookModule,
    ],
    controllers: [UserWithdrawalController],
    providers: [UserWithdrawalService, ApiKeyAuthGuard, EncryptionService],
    exports: [UserWithdrawalService],
})
export class UserWithdrawalModule { }
