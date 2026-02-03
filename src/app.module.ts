import { ServeStaticModule } from "@nestjs/serve-static";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { ConfigService } from "./config/config.service";
import { ConfigModule } from "@nestjs/config";
import { MerchantsModule } from "./merchants/merchants.module";
import { InquiryModule } from "./inquiry/inquiry.module";
import { MailerModule } from "@nestjs-modules/mailer";
import { PagesModule } from "./pages/pages.module";
import { FaqModule } from "./faq/faq.module";
import { ContactUsModule } from "./contact-us/contact-us.module";
import { OtherPagesModule } from "./other-pages/other-pages.module";
import { PricingModule } from "./pricing/pricing.module";
import { HowItWorksModule } from "./how-it-works/how-it-works.module";
import { TestimonialModule } from "./testimonial/testimonial.module";
import { AppsModule } from "./apps/apps.module";
import { NetworkModule } from "./network/network.module";
import { TokenModule } from "./token/token.module";
import { OrderModule } from "./order/order.module";
import { MerchantAppTxModule } from "./merchant-app-tx/merchant-app-tx.module";
import { PaymentLinkModule } from "./payment-link/payment-link.module";
import { WalletMonitorModule } from "./wallet-monitor/wallet-monitor.module";
import { ScheduleModule } from "@nestjs/schedule";
import { MoralisTxModule } from "./moralis-tx/moralis-tx.module";
import { join } from "path";
import { NotificationModule } from "./notification/notification.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"), // Adjust the path as needed
      serveRoot: "/uploads", // The route to access the static files
    }),
    MailerModule.forRoot({
      transport: {
        host: ConfigService.keys.SMTP_HOST,
        port: ConfigService.keys.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: ConfigService.keys.SMTP_AUTH_EMAIL,
          pass: ConfigService.keys.SMTP_AUTH_PASS,
        },
        tls: {
          rejectUnauthorized: true, // Ensures that self-signed certificates are rejected
        },
      },
      defaults: {
        from: "newsletter@coinpera.com",
      },
    }),
    ConfigModule,
    MongooseModule.forRoot(ConfigService.keys.MONGO_URL),
    AuthModule,
    AdminModule,
    MerchantsModule,
    InquiryModule,
    PagesModule,
    FaqModule,
    ContactUsModule,
    OtherPagesModule,
    PricingModule,
    HowItWorksModule,
    TestimonialModule,
    AppsModule,
    NetworkModule,
    TokenModule,
    OrderModule,
    MerchantAppTxModule,
    PaymentLinkModule,
    WalletMonitorModule,
    MoralisTxModule,
    NotificationModule,
    // MerchantTransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
