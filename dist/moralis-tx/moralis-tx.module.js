"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoralisTxModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const moralis_tx_controller_1 = require("./moralis-tx.controller");
const moralis_tx_service_1 = require("./moralis-tx.service");
const moralis_tx_schema_1 = require("./schema/moralis-tx.schema");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const merchant_app_tx_schema_1 = require("../merchant-app-tx/schema/merchant-app-tx.schema");
const encryption_service_1 = require("../utils/encryption.service");
const admin_module_1 = require("../admin/admin.module");
const token_schema_1 = require("../token/schema/token.schema");
const admin_schema_1 = require("../admin/schema/admin.schema");
const webhook_module_1 = require("../webhook/webhook.module");
let MoralisTxModule = class MoralisTxModule {
};
exports.MoralisTxModule = MoralisTxModule;
exports.MoralisTxModule = MoralisTxModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: "Transaction", schema: moralis_tx_schema_1.TransactionSchema },
                { name: "WalletMonitor", schema: wallet_monitor_schema_1.WalletMonitorSchema },
                { name: "PaymentLink", schema: payment_link_schema_1.PaymentLinkSchema },
                { name: "Apps", schema: apps_schema_1.AppsSchema },
                { name: "MerchantAppTx", schema: merchant_app_tx_schema_1.MerchantAppTxSchema },
                { name: "Token", schema: token_schema_1.TokenSchema },
                { name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema },
            ]),
            admin_module_1.AdminModule,
            webhook_module_1.WebhookModule,
        ],
        controllers: [moralis_tx_controller_1.MoralisTxController],
        providers: [moralis_tx_service_1.TransactionService, encryption_service_1.EncryptionService],
        exports: [moralis_tx_service_1.TransactionService],
    })
], MoralisTxModule);
//# sourceMappingURL=moralis-tx.module.js.map