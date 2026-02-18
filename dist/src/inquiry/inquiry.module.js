"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const email_module_1 = require("../emails/email.module");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const notification_schema_1 = require("../notification/schema/notification.schema");
const inquiry_controller_1 = require("./inquiry.controller");
const inquiry_service_1 = require("./inquiry.service");
const inquiry_schema_1 = require("./schema/inquiry.schema");
let InquiryModule = class InquiryModule {
};
exports.InquiryModule = InquiryModule;
exports.InquiryModule = InquiryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: inquiry_schema_1.Inquiry.name, schema: inquiry_schema_1.InquirySchema },
                { name: merchant_schema_1.Merchant.name, schema: merchant_schema_1.MerchantSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
            ]),
            email_module_1.EmailModule,
        ],
        controllers: [inquiry_controller_1.InquiryController],
        providers: [inquiry_service_1.InquiryService],
        exports: [inquiry_service_1.InquiryService],
    })
], InquiryModule);
//# sourceMappingURL=inquiry.module.js.map