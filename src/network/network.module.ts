import { Module } from "@nestjs/common";
import { NetworkService } from "./network.service";
import { NetworkController } from "./network.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Network, NetworkSchema } from "./schema/network.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Network.name, schema: NetworkSchema }]),
  ],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}
