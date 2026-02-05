"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const config_service_1 = require("./config/config.service");
const express = require("express");
const moralis_1 = __importDefault(require("moralis"));
const token_service_1 = require("./token/token.service");
const admin_service_1 = require("./admin/admin.service");
const faq_service_1 = require("./faq/faq.service");
const pages_service_1 = require("./pages/pages.service");
const other_pages_service_1 = require("./other-pages/other-pages.service");
const testimonial_service_1 = require("./testimonial/testimonial.service");
const how_it_works_service_1 = require("./how-it-works/how-it-works.service");
const pricing_service_1 = require("./pricing/pricing.service");
async function bootstrap() {
    console.log("--------------------------- : ", config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.enableCors();
    app.enableCors();
    app.use(express.static("public"));
    app.use("/uploads", express.static((0, path_1.join)(process.cwd(), "uploads")));
    await moralis_1.default.start({
        apiKey: config_service_1.ConfigService.keys.MORALIS_KEY,
    });
    const tokenService = app.get(token_service_1.TokenService);
    await tokenService.ensureDefaultTokensExist();
    const adminService = app.get(admin_service_1.AdminService);
    await adminService.ensureDefaultAdminExist();
    const faqService = app.get(faq_service_1.FaqService);
    await faqService.ensureDefaultFaqExist();
    const pageService = app.get(pages_service_1.PagesService);
    await pageService.ensureDefaultPageExist();
    const otherpageService = app.get(other_pages_service_1.OtherPagesService);
    await otherpageService.ensureDefaultOtherPageExist();
    const testimonial = app.get(testimonial_service_1.TestimonialService);
    await testimonial.ensureDefaultTestimonialExist();
    const howWork = app.get(how_it_works_service_1.HowItWorksService);
    await howWork.ensureDefaultWorkExist();
    const pricing = app.get(pricing_service_1.PricingService);
    await pricing.ensureDefaultPricingExist();
    await app.listen(config_service_1.ConfigService.keys.PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map