import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "./config/config.service";
const express = require("express");
import Moralis from "moralis";
import { TokenService } from "./token/token.service";
import { AdminService } from "./admin/admin.service";
import { FaqService } from "./faq/faq.service";
import { PagesService } from "./pages/pages.service";
import { OtherPagesService } from "./other-pages/other-pages.service";
import { TestimonialService } from "./testimonial/testimonial.service";
import { HowItWorksService } from "./how-it-works/how-it-works.service";
import { PricingService } from "./pricing/pricing.service";
// For test only --

async function bootstrap() {

  console.log("--------------------------- : ", ConfigService.keys.BTC_OWNER_ADDRESS);

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.enableCors();
  app.use(express.static("public"));
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  await Moralis.start({
    apiKey: ConfigService.keys.MORALIS_KEY,
  });
  // Rahul
  // Import default data entryies +++++++++++++++++++++++++++++++++
  const tokenService = app.get(TokenService);
  await tokenService.ensureDefaultTokensExist();

  const adminService = app.get(AdminService);
  await adminService.ensureDefaultAdminExist();

  const faqService = app.get(FaqService);
  await faqService.ensureDefaultFaqExist();

  const pageService = app.get(PagesService);
  await pageService.ensureDefaultPageExist();

  const otherpageService = app.get(OtherPagesService);
  await otherpageService.ensureDefaultOtherPageExist();

  const testimonial = app.get(TestimonialService);
  await testimonial.ensureDefaultTestimonialExist();

  const howWork = app.get(HowItWorksService);
  await howWork.ensureDefaultWorkExist();

  const pricing = app.get(PricingService);
  await pricing.ensureDefaultPricingExist();

  // ----------------------------------------------------------------

  await app.listen(ConfigService.keys.PORT);
}
bootstrap();
