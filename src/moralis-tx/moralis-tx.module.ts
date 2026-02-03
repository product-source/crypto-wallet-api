import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MoralisTxController } from "./moralis-tx.controller";
import { TransactionService } from "./moralis-tx.service";
import { TransactionSchema } from "./schema/moralis-tx.schema";
import { WalletMonitorSchema } from "src/wallet-monitor/schema/wallet-monitor.schema";
import { PaymentLinkSchema } from "src/payment-link/schema/payment-link.schema";
import { AppsSchema } from "src/apps/schema/apps.schema";
import { MerchantAppTxSchema } from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { AdminModule } from "src/admin/admin.module";
import { TokenSchema } from "src/token/schema/token.schema";
import { Admin, AdminSchema } from "src/admin/schema/admin.schema";
import { WebhookModule } from "src/webhook/webhook.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Transaction", schema: TransactionSchema },
      { name: "WalletMonitor", schema: WalletMonitorSchema },
      { name: "PaymentLink", schema: PaymentLinkSchema },
      { name: "Apps", schema: AppsSchema },
      { name: "MerchantAppTx", schema: MerchantAppTxSchema },
      { name: "Token", schema: TokenSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    AdminModule,
    WebhookModule,
  ],
  controllers: [MoralisTxController],
  providers: [TransactionService, EncryptionService],
  exports: [TransactionService],
})
export class MoralisTxModule {}
