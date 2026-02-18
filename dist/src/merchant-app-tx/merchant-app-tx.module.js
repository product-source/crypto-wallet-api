"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAppTxModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_app_tx_service_1 = require("./merchant-app-tx.service");
const merchant_app_tx_controller_1 = require("./merchant-app-tx.controller");
const merchant_app_tx_schema_1 = require("./schema/merchant-app-tx.schema");
const mongoose_1 = require("@nestjs/mongoose");
const apps_schema_1 = require("../apps/schema/apps.schema");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const email_module_1 = require("../emails/email.module");
const admin_module_1 = require("../admin/admin.module");
const token_module_1 = require("../token/token.module");
const encryption_service_1 = require("../utils/encryption.service");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const fiat_withdraw_schema_1 = require("./schema/fiat-withdraw.schema");
let MerchantAppTxModule = class MerchantAppTxModule {
};
exports.MerchantAppTxModule = MerchantAppTxModule;
exports.MerchantAppTxModule = MerchantAppTxModule = __decorate([
    (0, common_1.Module)({
        imports: [
            token_module_1.TokenModule,
            email_module_1.EmailModule,
            admin_module_1.AdminModule,
            mongoose_1.MongooseModule.forFeature([
                { name: merchant_app_tx_schema_1.MerchantAppTx.name, schema: merchant_app_tx_schema_1.MerchantAppTxSchema },
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
                { name: payment_link_schema_1.PaymentLink.name, schema: payment_link_schema_1.PaymentLinkSchema },
                { name: merchant_schema_1.Merchant.name, schema: merchant_schema_1.MerchantSchema },
                { name: fiat_withdraw_schema_1.FiatWithdraw.name, schema: fiat_withdraw_schema_1.FiatWithdrawSchema },
            ]),
        ],
        controllers: [merchant_app_tx_controller_1.MerchantAppTxController],
        providers: [merchant_app_tx_service_1.MerchantAppTxService, encryption_service_1.EncryptionService],
    })
], MerchantAppTxModule);
//# sourceMappingURL=merchant-app-tx.module.js.map