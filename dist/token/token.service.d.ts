import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Token, TokenDocument } from "./schema/token.schema";
import { Model } from "mongoose";
import { AddTokenDto, UpdateMinWithdrawDto } from "./dto/token.dto";
import { NotificationDocument } from "src/notification/schema/notification.schema";
import { FiatCurrencyService } from "src/fiat-currency/fiat-currency.service";
export declare class TokenService {
    private readonly tokenModel;
    private readonly notificationModel;
    private readonly fiatCurrencyService;
    constructor(tokenModel: Model<TokenDocument>, notificationModel: Model<NotificationDocument>, fiatCurrencyService: FiatCurrencyService);
    ensureDefaultTokensExist(): Promise<void>;
    addToken(dto: AddTokenDto): Promise<{
        message: string;
    }>;
    getTokens(query: any): Promise<{
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, TokenDocument, {}, {}> & Token & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    tokenById(query: any): Promise<NotFoundException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, TokenDocument, {}, {}> & Token & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    updateMinWithdraw(dto: UpdateMinWithdrawDto, user: any): Promise<NotFoundException | BadRequestException | {
        message: string;
        data: import("mongoose").Document<unknown, {}, TokenDocument, {}, {}> & Token & Document & {
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
    convertCurrency(query: {
        from: string;
        to: string;
        amount: number;
    }): Promise<{
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
