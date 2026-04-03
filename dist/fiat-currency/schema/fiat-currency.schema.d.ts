export type FiatCurrencyDocument = FiatCurrency & Document;
export declare class FiatCurrency {
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
}
export declare const FiatCurrencySchema: import("mongoose").Schema<FiatCurrency, import("mongoose").Model<FiatCurrency, any, any, any, import("mongoose").Document<unknown, any, FiatCurrency, any, {}> & FiatCurrency & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FiatCurrency, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<FiatCurrency>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<FiatCurrency> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
