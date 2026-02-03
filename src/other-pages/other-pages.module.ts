import { Module } from "@nestjs/common";
import { OtherPagesService } from "./other-pages.service";
import { OtherPagesController } from "./other-pages.controller";
import { OtherPage, OtherPageSchema } from "./schema/other-pages.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OtherPage.name, schema: OtherPageSchema },
    ]),
  ],
  controllers: [OtherPagesController],
  providers: [OtherPagesService],
})
export class OtherPagesModule {}
