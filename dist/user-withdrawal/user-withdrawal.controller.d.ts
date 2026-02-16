import { UserWithdrawalService } from "./user-withdrawal.service";
import { CreateWithdrawalRequestDto, ApproveWithdrawalDto, DeclineWithdrawalDto, ListWithdrawalsDto, GetBalanceDto, UpdateWithdrawalSettingsDto, ExternalApproveWithdrawalDto, ExternalDeclineWithdrawalDto, ExternalListWithdrawalsDto, GetWithdrawalStatusDto } from "./dto/user-withdrawal.dto";
export declare class UserWithdrawalController {
    private readonly userWithdrawalService;
    constructor(userWithdrawalService: UserWithdrawalService);
    createWithdrawalRequest(dto: CreateWithdrawalRequestDto): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus;
            externalReference: string;
            createdAt: Date;
        };
    }>;
    listWithdrawals(dto: ExternalListWithdrawalsDto): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/user-withdrawal.schema").UserWithdrawalDocument, {}, {}> & import("./schema/user-withdrawal.schema").UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getBalance(dto: GetBalanceDto): Promise<{
        success: boolean;
        data: {
            appId: string;
            balances: {
                tokenId: import("mongoose").Types.ObjectId;
                symbol: string;
                code: string;
                chainId: string;
                network: string;
                walletAddress: string;
                balance: string;
            }[];
        };
    }>;
    approveWithdrawal(dto: ExternalApproveWithdrawalDto): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus.APPROVED;
        };
    }>;
    declineWithdrawal(dto: ExternalDeclineWithdrawalDto): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus.DECLINED;
            declineReason: string;
        };
    }>;
    getWithdrawalStatus(dto: GetWithdrawalStatusDto): Promise<{
        success: boolean;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus;
            txHash: string;
            failureReason: string;
            createdAt: Date;
            processedAt: Date;
        };
    }>;
    merchantListWithdrawals(dto: ListWithdrawalsDto, req: any): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/user-withdrawal.schema").UserWithdrawalDocument, {}, {}> & import("./schema/user-withdrawal.schema").UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    merchantWithdrawalHistory(pageNo: number, limitVal: number, status: string, req: any): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/user-withdrawal.schema").UserWithdrawalDocument, {}, {}> & import("./schema/user-withdrawal.schema").UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    merchantApproveWithdrawal(dto: ApproveWithdrawalDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus.APPROVED;
        };
    }>;
    merchantDeclineWithdrawal(dto: DeclineWithdrawalDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: import("mongoose").Types.ObjectId;
            status: import("./schema/user-withdrawal.enum").UserWithdrawalStatus.DECLINED;
            declineReason: string;
        };
    }>;
    updateWithdrawalSettings(dto: UpdateWithdrawalSettingsDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getWithdrawalSettings(appId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    merchantGetBalance(appId: string, req: any): Promise<{
        success: boolean;
        data: {
            appId: string;
            balances: {
                tokenId: import("mongoose").Types.ObjectId;
                symbol: string;
                code: string;
                chainId: string;
                network: string;
                walletAddress: string;
                balance: string;
            }[];
        };
    }>;
    adminListWithdrawals(pageNo?: number, limitVal?: number, status?: string, merchantId?: string, search?: string): Promise<{
        success: boolean;
        message: string;
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/user-withdrawal.schema").UserWithdrawalDocument, {}, {}> & import("./schema/user-withdrawal.schema").UserWithdrawal & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
}
