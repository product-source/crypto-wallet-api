import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Token, TokenDocument } from "./schema/token.schema";
import { Model } from "mongoose";
import { AddTokenDto, UpdateMinWithdrawDto } from "./dto/token.dto";
import { NotificationDocument } from "src/notification/schema/notification.schema";
export declare class TokenService {
    private readonly tokenModel;
    private readonly notificationModel;
    constructor(tokenModel: Model<TokenDocument>, notificationModel: Model<NotificationDocument>);
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
}
