import { Module } from "@nestjs/common";
import { AppsService } from "./apps.service";
import { AppsController } from "./apps.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Apps, AppsSchema } from "./schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";

import {
  WalletMonitor,
  WalletMonitorSchema,
} from "src/wallet-monitor/schema/wallet-monitor.schema";
import { TokenSchema } from "src/token/schema/token.schema";
import {
  PaymentLink,
  PaymentLinkSchema,
} from "src/payment-link/schema/payment-link.schema";
import {
  FiatWithdraw,
  FiatWithdrawSchema,
} from "src/merchant-app-tx/schema/fiat-withdraw.schema";
import { Merchant, MerchantSchema } from "src/merchants/schema/merchant.schema";
import { WebhookModule } from "src/webhook/webhook.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Apps.name, schema: AppsSchema },
      { name: WalletMonitor.name, schema: WalletMonitorSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PaymentLink.name, schema: PaymentLinkSchema },
      { name: "Token", schema: TokenSchema },
      { name: FiatWithdraw.name, schema: FiatWithdrawSchema },
      { name: Merchant.name, schema: MerchantSchema },
    ]),
    WebhookModule,
  ],
  controllers: [AppsController],
  providers: [AppsService, EncryptionService],
})
export class AppsModule {}
