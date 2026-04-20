import { Module } from "@nestjs/common";
import { PaymentLinkService } from "./payment-link.service";
import { PaymentLinkController } from "./payment-link.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentLink, PaymentLinkSchema } from "./schema/payment-link.schema";
import { Apps, AppsSchema } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
import {
  WalletMonitor,
  WalletMonitorSchema,
} from "src/wallet-monitor/schema/wallet-monitor.schema";
import { Token, TokenSchema } from "src/token/schema/token.schema";
import {
  MerchantAppTx,
  MerchantAppTxSchema,
} from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import { AdminModule } from "src/admin/admin.module";
import { WebhookModule } from "src/webhook/webhook.module";
import { FiatCurrencyModule } from "src/fiat-currency/fiat-currency.module";
import { SystemSettingsModule } from "src/system-settings/system-settings.module";

@Module({
  imports: [
    AdminModule,
    WebhookModule,
    FiatCurrencyModule,
    SystemSettingsModule,
    MongooseModule.forFeature([
      { name: PaymentLink.name, schema: PaymentLinkSchema },
      { name: Apps.name, schema: AppsSchema },
      { name: WalletMonitor.name, schema: WalletMonitorSchema },
      { name: Token.name, schema: TokenSchema },
      { name: MerchantAppTx.name, schema: MerchantAppTxSchema },
    ]),
  ],
  controllers: [PaymentLinkController],
  providers: [PaymentLinkService, EncryptionService],
})
export class PaymentLinkModule {}
