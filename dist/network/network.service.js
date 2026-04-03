"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const network_schema_1 = require("./schema/network.schema");
const mongoose_2 = require("mongoose");
let NetworkService = class NetworkService {
    constructor(networkModel) {
        this.networkModel = networkModel;
    }
    async addNetwork(dto) {
        try {
            const { networkName, rpcUrl, chainId, currencySymbol, blockExplorerUrl, address, } = dto;
            const model = await new this.networkModel();
            model.networkName = networkName;
            model.rpcUrl = rpcUrl;
            model.chainId = chainId;
            model.currencySymbol = currencySymbol;
            model.blockExplorerUrl = blockExplorerUrl;
            model.address = address;
            await model.save();
            return { message: "Network added succesfully" };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
};
exports.NetworkService = NetworkService;
exports.NetworkService = NetworkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(network_schema_1.Network.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NetworkService);
//# sourceMappingURL=network.service.js.map