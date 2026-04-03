"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const webhook_service_1 = require("./webhook.service");
const webhook_log_schema_1 = require("./schema/webhook-log.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const encryption_service_1 = require("../utils/encryption.service");
let WebhookModule = class WebhookModule {
};
exports.WebhookModule = WebhookModule;
exports.WebhookModule = WebhookModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: webhook_log_schema_1.WebhookLog.name, schema: webhook_log_schema_1.WebhookLogSchema },
                { name: apps_schema_1.Apps.name, schema: apps_schema_1.AppsSchema },
            ]),
        ],
        providers: [webhook_service_1.WebhookService, encryption_service_1.EncryptionService],
        exports: [webhook_service_1.WebhookService],
    })
], WebhookModule);
//# sourceMappingURL=webhook.module.js.map