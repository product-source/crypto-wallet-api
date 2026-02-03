import { Module } from "@nestjs/common";
import { TestimonialService } from "./testimonial.service";
import { TestimonialController } from "./testimonial.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Testimonial, TestimonialSchema } from "./schema/testimonial.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Testimonial.name, schema: TestimonialSchema },
    ]),
  ],
  controllers: [TestimonialController],
  providers: [TestimonialService],
})
export class TestimonialModule {}
