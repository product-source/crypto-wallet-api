import { NetworkDocument } from "./schema/network.schema";
import { Model } from "mongoose";
import { AddNetworkDto } from "./dto/network.dto";
export declare class NetworkService {
    private readonly networkModel;
    constructor(networkModel: Model<NetworkDocument>);
    addNetwork(dto: AddNetworkDto): Promise<{
        message: string;
    }>;
}
