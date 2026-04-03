import { FiatCurrency, FiatCurrencyDocument } from "./schema/fiat-currency.schema";
import { Model } from "mongoose";
export declare class FiatCurrencyService {
    private readonly fiatCurrencyModel;
    constructor(fiatCurrencyModel: Model<FiatCurrencyDocument>);
    ensureDefaultFiatCurrenciesExist(): Promise<void>;
    getAll(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, FiatCurrencyDocument, {}, {}> & FiatCurrency & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getAllCodes(): Promise<string[]>;
    getAllWithDetails(): Promise<{
        code: string;
        name: string;
        symbol: string;
    }[]>;
    addFiatCurrency(dto: {
        code: string;
        name: string;
        symbol?: string;
    }): Promise<{
        message: string;
    }>;
    deleteFiatCurrency(id: string): Promise<{
        message: string;
    }>;
}
