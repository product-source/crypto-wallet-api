"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const serve_static_1 = require("@nestjs/serve-static");
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("./auth/auth.module");
const admin_module_1 = require("./admin/admin.module");
const config_service_1 = require("./config/config.service");
const config_1 = require("@nestjs/config");
const merchants_module_1 = require("./merchants/merchants.module");
const inquiry_module_1 = require("./inquiry/inquiry.module");
const mailer_1 = require("@nestjs-modules/mailer");
const pages_module_1 = require("./pages/pages.module");
const faq_module_1 = require("./faq/faq.module");
const contact_us_module_1 = require("./contact-us/contact-us.module");
const other_pages_module_1 = require("./other-pages/other-pages.module");
const pricing_module_1 = require("./pricing/pricing.module");
const how_it_works_module_1 = require("./how-it-works/how-it-works.module");
const testimonial_module_1 = require("./testimonial/testimonial.module");
const apps_module_1 = require("./apps/apps.module");
const network_module_1 = require("./network/network.module");
const token_module_1 = require("./token/token.module");
const order_module_1 = require("./order/order.module");
const merchant_app_tx_module_1 = require("./merchant-app-tx/merchant-app-tx.module");
const payment_link_module_1 = require("./payment-link/payment-link.module");
const wallet_monitor_module_1 = require("./wallet-monitor/wallet-monitor.module");
const schedule_1 = require("@nestjs/schedule");
const moralis_tx_module_1 = require("./moralis-tx/moralis-tx.module");
const path_1 = require("path");
const notification_module_1 = require("./notification/notification.module");
const user_withdrawal_module_1 = require("./user-withdrawal/user-withdrawal.module");
const common_controller_1 = require("./common/common.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, "..", "uploads"),
                serveRoot: "/uploads",
            }),
            mailer_1.MailerModule.forRoot({
                transport: {
                    host: config_service_1.ConfigService.keys.SMTP_HOST,
                    port: config_service_1.ConfigService.keys.SMTP_PORT,
                    secure: false,
                    auth: {
                        user: config_service_1.ConfigService.keys.SMTP_AUTH_EMAIL,
                        pass: config_service_1.ConfigService.keys.SMTP_AUTH_PASS,
                    },
                    tls: {
                        rejectUnauthorized: true,
                    },
                },
                defaults: {
                    from: "newsletter@coinpera.com",
                },
            }),
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forRoot(config_service_1.ConfigService.keys.MONGO_URL),
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            merchants_module_1.MerchantsModule,
            inquiry_module_1.InquiryModule,
            pages_module_1.PagesModule,
            faq_module_1.FaqModule,
            contact_us_module_1.ContactUsModule,
            other_pages_module_1.OtherPagesModule,
            pricing_module_1.PricingModule,
            how_it_works_module_1.HowItWorksModule,
            testimonial_module_1.TestimonialModule,
            apps_module_1.AppsModule,
            network_module_1.NetworkModule,
            token_module_1.TokenModule,
            order_module_1.OrderModule,
            merchant_app_tx_module_1.MerchantAppTxModule,
            payment_link_module_1.PaymentLinkModule,
            wallet_monitor_module_1.WalletMonitorModule,
            moralis_tx_module_1.MoralisTxModule,
            notification_module_1.NotificationModule,
            user_withdrawal_module_1.UserWithdrawalModule,
        ],
        controllers: [app_controller_1.AppController, common_controller_1.CommonController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map