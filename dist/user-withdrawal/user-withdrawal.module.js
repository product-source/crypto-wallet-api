"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWithdrawalModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_withdrawal_controller_1 = require("./user-withdrawal.controller");
const user_withdrawal_service_1 = require("./user-withdrawal.service");
const user_withdrawal_schema_1 = require("./schema/user-withdrawal.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const token_schema_1 = require("../token/schema/token.schema");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const encryption_service_1 = require("../utils/encryption.service");
const webhook_module_1 = require("../webhook/webhook.module");
const api_key_auth_guard_1 = require("../auth/guards/api-key-auth.guard");
let UserWithdrawalModule = class UserWithdrawalModule {
};
exports.UserWithdrawalModule = UserWithdrawalModule;
exports.UserWithdrawalModule = UserWithdrawalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_withdrawal_schema_1.UserWithdrawal.name, schema: user_withdrawal_schema_1.UserWithdrawalSchema },
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
                { name: token_schema_1.Token.name, schema: token_schema_1.TokenSchema },
                { name: merchant_schema_1.Merchant.name, schema: merchant_schema_1.MerchantSchema },
            ]),
            webhook_module_1.WebhookModule,
        ],
        controllers: [user_withdrawal_controller_1.UserWithdrawalController],
        providers: [user_withdrawal_service_1.UserWithdrawalService, api_key_auth_guard_1.ApiKeyAuthGuard, encryption_service_1.EncryptionService],
        exports: [user_withdrawal_service_1.UserWithdrawalService],
    })
], UserWithdrawalModule);
//# sourceMappingURL=user-withdrawal.module.js.map