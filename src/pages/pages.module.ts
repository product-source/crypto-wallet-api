import { Module } from "@nestjs/common";
import { PagesService } from "./pages.service";
import { PagesController } from "./pages.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Page, PageSchema } from "./schema/pages.schema";
import { UploadFile, UploadFileSchema } from "./schema/uploadFile.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
      { name: UploadFile.name, schema: UploadFileSchema },
    ]),
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
