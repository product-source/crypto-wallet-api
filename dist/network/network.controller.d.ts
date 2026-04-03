import { NetworkService } from "./network.service";
import { AddNetworkDto } from "./dto/network.dto";
export declare class NetworkController {
    private readonly networkService;
    constructor(networkService: NetworkService);
    addPage(dto: AddNetworkDto): Promise<{
        message: string;
    }>;
}
