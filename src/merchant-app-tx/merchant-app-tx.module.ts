import { Module } from "@nestjs/common";
import { MerchantAppTxService } from "./merchant-app-tx.service";
import { MerchantAppTxController } from "./merchant-app-tx.controller";
import {
  MerchantAppTx,
  MerchantAppTxSchema,
} from "./schema/merchant-app-tx.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { Apps, AppsSchema } from "src/apps/schema/apps.schema";
import {
  PaymentLink,
  PaymentLinkSchema,
} from "src/payment-link/schema/payment-link.schema";
import { EmailModule } from "src/emails/email.module";
import { AdminModule } from "src/admin/admin.module";
import { TokenModule } from "src/token/token.module";
import { EncryptionService } from "src/utils/encryption.service";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";
import { FiatWithdraw, FiatWithdrawSchema } from "./schema/fiat-withdraw.schema";

@Module({
  imports: [
    TokenModule,
    EmailModule,
    AdminModule,
    MongooseModule.forFeature([
      { name: MerchantAppTx.name, schema: MerchantAppTxSchema },
      { name: Apps.name, schema: AppsSchema },
      { name: PaymentLink.name, schema: PaymentLinkSchema },
      { name: Merchant.name, schema: MerchantSchema },
      { name: FiatWithdraw.name, schema: FiatWithdrawSchema },
    ]),
  ],
  controllers: [MerchantAppTxController],
  providers: [MerchantAppTxService, EncryptionService],
})
export class MerchantAppTxModule {}
