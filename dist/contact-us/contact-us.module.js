"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactUsModule = void 0;
const common_1 = require("@nestjs/common");
const contact_us_service_1 = require("./contact-us.service");
const contact_us_controller_1 = require("./contact-us.controller");
const mongoose_1 = require("@nestjs/mongoose");
const contact_us_schema_1 = require("./schema/contact-us.schema");
const email_module_1 = require("../emails/email.module");
const pricing_schema_1 = require("../pricing/schema/pricing.schema");
let ContactUsModule = class ContactUsModule {
};
exports.ContactUsModule = ContactUsModule;
exports.ContactUsModule = ContactUsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            mongoose_1.MongooseModule.forFeature([
                { name: contact_us_schema_1.ContactUs.name, schema: contact_us_schema_1.ContactUsSchema },
                { name: pricing_schema_1.Pricing.name, schema: pricing_schema_1.PricingSchema },
            ]),
        ],
        controllers: [contact_us_controller_1.ContactUsController],
        providers: [contact_us_service_1.ContactUsService],
    })
], ContactUsModule);
//# sourceMappingURL=contact-us.module.js.map