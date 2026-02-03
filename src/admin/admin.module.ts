import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { MongooseModule } from "@nestjs/mongoose";

import { Admin, AdminSchema } from "./schema/admin.schema";
import { EmailModule } from "src/emails/email.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
