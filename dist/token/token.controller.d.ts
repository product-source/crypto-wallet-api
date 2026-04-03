import { TokenService } from "./token.service";
import { AddTokenDto, UpdateMinWithdrawDto } from "./dto/token.dto";
export declare class TokenController {
    private readonly tokenService;
    constructor(tokenService: TokenService);
    addPage(dto: AddTokenDto): Promise<{
        message: string;
    }>;
    getToken(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/token.schema").TokenDocument, {}, {}> & import("./schema/token.schema").Token & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getTokenById(query: any): Promise<import("@nestjs/common").NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/token.schema").TokenDocument, {}, {}> & import("./schema/token.schema").Token & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateMinWithdraw(dto: UpdateMinWithdrawDto, req: any): Promise<import("@nestjs/common").NotFoundException | import("@nestjs/common").BadRequestException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schema/token.schema").TokenDocument, {}, {}> & import("./schema/token.schema").Token & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    deleteToken(query: any): Promise<{
        message: string;
    }>;
    getValidateTronAddress(query: any): Promise<{
        isValid: boolean;
    }>;
    convertCurrency(from: string, to: string, amount: number): Promise<{
        success: boolean;
        from: string;
        to: string;
        amount: number;
        convertedAmount: number;
        rate: number;
        timestamp: string;
    }>;
    getSupportedCurrencies(): Promise<{
        crypto: {
            code: string;
            symbol: string;
            network: string;
        }[];
        fiat: {
            code: string;
            name: string;
            symbol: string;
        }[];
    }>;
}
