"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantsModule = void 0;
const common_1 = require("@nestjs/common");
const merchants_service_1 = require("./merchants.service");
const merchants_controller_1 = require("./merchants.controller");
const merchant_schema_1 = require("./schema/merchant.schema");
const mongoose_1 = require("@nestjs/mongoose");
const hash_service_1 = require("../admin/hash.service");
const email_module_1 = require("../emails/email.module");
const encryption_service_1 = require("../utils/encryption.service");
const apps_schema_1 = require("../apps/schema/apps.schema");
const notification_schema_1 = require("../notification/schema/notification.schema");
let MerchantsModule = class MerchantsModule {
};
exports.MerchantsModule = MerchantsModule;
exports.MerchantsModule = MerchantsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            mongoose_1.MongooseModule.forFeature([
                { name: merchant_schema_1.Merchant.name, schema: merchant_schema_1.MerchantSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
            ]),
        ],
        controllers: [merchants_controller_1.MerchantsController],
        providers: [merchants_service_1.MerchantsService, hash_service_1.HashService, encryption_service_1.EncryptionService],
        exports: [merchants_service_1.MerchantsService],
    })
], MerchantsModule);
//# sourceMappingURL=merchants.module.js.map