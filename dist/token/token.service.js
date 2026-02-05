"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const token_schema_1 = require("./schema/token.schema");
const mongoose_2 = require("mongoose");
const tron_helper_1 = require("../helpers/tron.helper");
const notification_schema_1 = require("../notification/schema/notification.schema");
const path_1 = require("path");
const fs = __importStar(require("fs/promises"));
let TokenService = class TokenService {
    constructor(tokenModel, notificationModel) {
        this.tokenModel = tokenModel;
        this.notificationModel = notificationModel;
    }
    async ensureDefaultTokensExist() {
        const tokenCount = await this.tokenModel.countDocuments();
        if (tokenCount === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "coinpera-web.tokens.json");
            const fileContent = await fs.readFile(filePath, "utf8");
            const rawTokensData = JSON.parse(fileContent);
            const tokensData = rawTokensData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
            await this.tokenModel.insertMany(tokensData);
            console.log("Default tokens inserted successfully.......................");
        }
    }
    async addToken(dto) {
        try {
            const { address, chainId, network, symbol, code, minWithdraw, decimal, minDeposit, } = dto;
            const tokenExist = await this.tokenModel.findOne({ code: code });
            if (tokenExist) {
                throw new common_1.BadRequestException("This token code is already exist");
            }
            const model = await new this.tokenModel();
            model.address = address;
            model.chainId = chainId;
            model.network = network;
            model.symbol = symbol;
            model.code = code;
            model.minWithdraw = minWithdraw;
            model.decimal = decimal;
            model.minDeposit = minDeposit;
            await model.save();
            const notificationModel = new this.notificationModel({
                notificationType: "ADMIN",
                message: `New Token ${model?.code} added`,
            });
            await notificationModel.save();
            return { message: "Token added succesfully" };
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
    async getTokens(query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 12;
            let queryObject = {};
            if (search) {
                queryObject = {
                    $or: [{ network: { $regex: search, $options: "i" } }],
                };
            }
            const token = await this.tokenModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.tokenModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "token info",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                data: token,
            };
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
    async tokenById(query) {
        try {
            const { tokenId } = query;
            const token = await this.tokenModel.findById(tokenId);
            if (!token) {
                return new common_1.NotFoundException("Invalid token Id");
            }
            return {
                message: "token by Id",
                data: token,
            };
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
    async updateMinWithdraw(dto, user) {
        try {
            const { tokenId, network, chainId, symbol, address, code, decimal, minWithdraw, minDeposit, } = dto;
            if (!user.isAdmin) {
                return new common_1.BadRequestException("Admin privilege required");
            }
            const token = await this.tokenModel.findById({
                _id: tokenId,
            });
            if (!token) {
                return new common_1.NotFoundException("Invalid token Id");
            }
            const tokenExist = await this.tokenModel.findOne({ code: code });
            if (tokenExist && tokenExist._id.toString() !== token._id.toString()) {
                throw new common_1.BadRequestException("This token code already exists");
            }
            token.network = network;
            token.chainId = chainId;
            token.symbol = symbol;
            token.address = address;
            token.code = code;
            token.decimal = decimal;
            token.minWithdraw = minWithdraw;
            token.minDeposit = minDeposit;
            await token.save();
            const notificationModel = new this.notificationModel({
                notificationType: "ADMIN",
                message: `${token?.code} Token is updated`,
            });
            await notificationModel.save();
            return {
                message: "Token Updated successfully",
                data: token,
            };
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
    async deleteToken(query) {
        try {
            const { id } = query;
            const token = await this.tokenModel.findById(id);
            if (!token) {
                throw new common_1.NotFoundException("Invalid Token Id");
            }
            const notificationModel = new this.notificationModel({
                notificationType: "ADMIN",
                message: `${token?.code} Token is deleted`,
            });
            await notificationModel.save();
            await this.tokenModel.findByIdAndDelete(id);
            return { message: "Token deleted succesfully" };
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
    async getValidateTronAddress(query) {
        try {
            const { address } = query;
            const isValid = (0, tron_helper_1.isValidTronAddress)(address);
            return {
                isValid,
            };
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
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(token_schema_1.Token.name)),
    __param(1, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TokenService);
//# sourceMappingURL=token.service.js.map