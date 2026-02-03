import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Network, NetworkDocument } from "./schema/network.schema";
import { Model } from "mongoose";
import { AddNetworkDto } from "./dto/network.dto";

@Injectable()
export class NetworkService {
  constructor(
    @InjectModel(Network.name)
    private readonly networkModel: Model<NetworkDocument>
  ) {}

  async addNetwork(dto: AddNetworkDto) {
    try {
      const {
        networkName,
        rpcUrl,
        chainId,
        currencySymbol,
        blockExplorerUrl,
        address,
      } = dto;

      const model = await new this.networkModel();
      model.networkName = networkName;
      model.rpcUrl = rpcUrl;
      model.chainId = chainId;
      model.currencySymbol = currencySymbol;
      model.blockExplorerUrl = blockExplorerUrl;
      model.address = address;

      await model.save();
      return { message: "Network added succesfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
}
