import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FiatCurrency, FiatCurrencyDocument } from "./schema/fiat-currency.schema";
import { Model } from "mongoose";
import { join } from "path";
import * as fs from "fs/promises";

@Injectable()
export class FiatCurrencyService {
    constructor(
        @InjectModel(FiatCurrency.name)
        private readonly fiatCurrencyModel: Model<FiatCurrencyDocument>
    ) { }

    async ensureDefaultFiatCurrenciesExist() {
        const count = await this.fiatCurrencyModel.countDocuments();
        if (count === 0) {
            const filePath = join(
                process.cwd(),
                "src/utils/data",
                "paycoinz-web.fiat-currencies.json"
            );
            try {
                const fileContent = await fs.readFile(filePath, "utf8");
                const rawData = JSON.parse(fileContent);
                const data = rawData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
                await this.fiatCurrencyModel.insertMany(data);
                console.log("Default fiat currencies inserted successfully.");
            } catch (error) {
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
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async getAllCodes(): Promise<string[]> {
        const currencies = await this.fiatCurrencyModel
            .find({ isActive: true })
            .select("code");
        return currencies.map((c) => c.code.toUpperCase());
    }

    async getAllWithDetails(): Promise<{ code: string; name: string; symbol: string }[]> {
        const currencies = await this.fiatCurrencyModel
            .find({ isActive: true })
            .select("code name symbol");
        return currencies.map((c) => ({
            code: c.code.toUpperCase(),
            name: c.name,
            symbol: c.symbol,
        }));
    }

    async addFiatCurrency(dto: { code: string; name: string; symbol?: string }) {
        try {
            const { code, name, symbol } = dto;
            const existing = await this.fiatCurrencyModel.findOne({
                code: code.toLowerCase(),
            });
            if (existing) {
                throw new BadRequestException("This fiat currency code already exists");
            }
            const model = new this.fiatCurrencyModel({
                code: code.toLowerCase(),
                name,
                symbol: symbol || "",
                isActive: true,
            });
            await model.save();
            return { message: "Fiat currency added successfully" };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException(error.message);
        }
    }

    async deleteFiatCurrency(id: string) {
        try {
            const currency = await this.fiatCurrencyModel.findById(id);
            if (!currency) throw new NotFoundException("Fiat currency not found");
            await this.fiatCurrencyModel.findByIdAndDelete(id);
            return { message: "Fiat currency deleted successfully" };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException(error.message);
        }
    }
}
