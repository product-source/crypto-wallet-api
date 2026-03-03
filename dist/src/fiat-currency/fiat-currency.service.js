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
exports.FiatCurrencyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const fiat_currency_schema_1 = require("./schema/fiat-currency.schema");
const mongoose_2 = require("mongoose");
const path_1 = require("path");
const fs = __importStar(require("fs/promises"));
let FiatCurrencyService = class FiatCurrencyService {
    constructor(fiatCurrencyModel) {
        this.fiatCurrencyModel = fiatCurrencyModel;
    }
    async ensureDefaultFiatCurrenciesExist() {
        const count = await this.fiatCurrencyModel.countDocuments();
        if (count === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "paycoinz-web.fiat-currencies.json");
            try {
                const fileContent = await fs.readFile(filePath, "utf8");
                const rawData = JSON.parse(fileContent);
                const data = rawData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
                await this.fiatCurrencyModel.insertMany(data);
                console.log("Default fiat currencies inserted successfully.");
            }
            catch (error) {
                console.log("Error seeding fiat currencies:", error.message);
            }
        }
    }
    async getAll() {
        try {
            const currencies = await this.fiatCurrencyModel
                .find({ isActive: true })
                .sort({ code: 1 });
            return {
                message: "Supported fiat currencies",
                data: currencies,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getAllCodes() {
        const currencies = await this.fiatCurrencyModel
            .find({ isActive: true })
            .select("code");
        return currencies.map((c) => c.code.toUpperCase());
    }
    async getAllWithDetails() {
        const currencies = await this.fiatCurrencyModel
            .find({ isActive: true })
            .select("code name symbol");
        return currencies.map((c) => ({
            code: c.code.toUpperCase(),
            name: c.name,
            symbol: c.symbol,
        }));
    }
    async addFiatCurrency(dto) {
        try {
            const { code, name, symbol } = dto;
            const existing = await this.fiatCurrencyModel.findOne({
                code: code.toLowerCase(),
            });
            if (existing) {
                throw new common_1.BadRequestException("This fiat currency code already exists");
            }
            const model = new this.fiatCurrencyModel({
                code: code.toLowerCase(),
                name,
                symbol: symbol || "",
                isActive: true,
            });
            await model.save();
            return { message: "Fiat currency added successfully" };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(error.message);
        }
    }
    async deleteFiatCurrency(id) {
        try {
            const currency = await this.fiatCurrencyModel.findById(id);
            if (!currency)
                throw new common_1.NotFoundException("Fiat currency not found");
            await this.fiatCurrencyModel.findByIdAndDelete(id);
            return { message: "Fiat currency deleted successfully" };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.FiatCurrencyService = FiatCurrencyService;
exports.FiatCurrencyService = FiatCurrencyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(fiat_currency_schema_1.FiatCurrency.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FiatCurrencyService);
//# sourceMappingURL=fiat-currency.service.js.map