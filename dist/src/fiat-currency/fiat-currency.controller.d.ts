import { FiatCurrencyService } from "./fiat-currency.service";
export declare class FiatCurrencyController {
    private readonly fiatCurrencyService;
    constructor(fiatCurrencyService: FiatCurrencyService);
    getAll(): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("./schema/fiat-currency.schema").FiatCurrencyDocument, {}, {}> & import("./schema/fiat-currency.schema").FiatCurrency & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
}
