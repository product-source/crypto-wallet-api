export type TokenDocument = Token & Document;
export declare class Token {
    address: string;
    chainId: string;
    network: string;
    symbol: string;
    code: string;
    minWithdraw: number;
    minDeposit: number;
    decimal: number;
}
export declare const TokenSchema: import("mongoose").Schema<Token, import("mongoose").Model<Token, any, any, any, import("mongoose").Document<unknown, any, Token, any, {}> & Token & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Token, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Token>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Token> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
