"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLinkModule = void 0;
const common_1 = require("@nestjs/common");
const payment_link_service_1 = require("./payment-link.service");
const payment_link_controller_1 = require("./payment-link.controller");
const mongoose_1 = require("@nestjs/mongoose");
const payment_link_schema_1 = require("./schema/payment-link.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const encryption_service_1 = require("../utils/encryption.service");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const token_schema_1 = require("../token/schema/token.schema");
const merchant_app_tx_schema_1 = require("../merchant-app-tx/schema/merchant-app-tx.schema");
const admin_module_1 = require("../admin/admin.module");
const webhook_module_1 = require("../webhook/webhook.module");
let PaymentLinkModule = class PaymentLinkModule {
};
exports.PaymentLinkModule = PaymentLinkModule;
exports.PaymentLinkModule = PaymentLinkModule = __decorate([
    (0, common_1.Module)({
        imports: [
            admin_module_1.AdminModule,
            webhook_module_1.WebhookModule,
            mongoose_1.MongooseModule.forFeature([
                { name: payment_link_schema_1.PaymentLink.name, schema: payment_link_schema_1.PaymentLinkSchema },
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
                { name: wallet_monitor_schema_1.WalletMonitor.name, schema: wallet_monitor_schema_1.WalletMonitorSchema },
                { name: token_schema_1.Token.name, schema: token_schema_1.TokenSchema },
                { name: merchant_app_tx_schema_1.MerchantAppTx.name, schema: merchant_app_tx_schema_1.MerchantAppTxSchema },
            ]),
        ],
        controllers: [payment_link_controller_1.PaymentLinkController],
        providers: [payment_link_service_1.PaymentLinkService, encryption_service_1.EncryptionService],
    })
], PaymentLinkModule);
//# sourceMappingURL=payment-link.module.js.map