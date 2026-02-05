"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsModule = void 0;
const common_1 = require("@nestjs/common");
const apps_service_1 = require("./apps.service");
const apps_controller_1 = require("./apps.controller");
const mongoose_1 = require("@nestjs/mongoose");
const apps_schema_1 = require("./schema/apps.schema");
const encryption_service_1 = require("../utils/encryption.service");
const notification_schema_1 = require("../notification/schema/notification.schema");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const token_schema_1 = require("../token/schema/token.schema");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const fiat_withdraw_schema_1 = require("../merchant-app-tx/schema/fiat-withdraw.schema");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const webhook_module_1 = require("../webhook/webhook.module");
let AppsModule = class AppsModule {
};
exports.AppsModule = AppsModule;
exports.AppsModule = AppsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
                { name: wallet_monitor_schema_1.WalletMonitor.name, schema: wallet_monitor_schema_1.WalletMonitorSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: payment_link_schema_1.PaymentLink.name, schema: payment_link_schema_1.PaymentLinkSchema },
                { name: "Token", schema: token_schema_1.TokenSchema },
                { name: fiat_withdraw_schema_1.FiatWithdraw.name, schema: fiat_withdraw_schema_1.FiatWithdrawSchema },
                { name: merchant_schema_1.Merchant.name, schema: merchant_schema_1.MerchantSchema },
            ]),
            webhook_module_1.WebhookModule,
        ],
        controllers: [apps_controller_1.AppsController],
        providers: [apps_service_1.AppsService, encryption_service_1.EncryptionService],
    })
], AppsModule);
//# sourceMappingURL=apps.module.js.map