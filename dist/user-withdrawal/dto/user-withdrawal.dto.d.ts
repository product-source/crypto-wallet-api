export declare class BaseAuthDto {
    appId: string;
    apiKey: string;
    secretKey: string;
}
export declare class CreateWithdrawalRequestDto extends BaseAuthDto {
    appId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    amount: string;
    code: string;
    walletAddress: string;
    externalReference?: string;
    note?: string;
}
export declare class ApproveWithdrawalDto {
    withdrawalId: string;
    note?: string;
}
export declare class ExternalApproveWithdrawalDto extends BaseAuthDto {
    withdrawalId: string;
    note?: string;
}
export declare class DeclineWithdrawalDto {
    withdrawalId: string;
    reason: string;
}
export declare class ExternalDeclineWithdrawalDto extends BaseAuthDto {
    withdrawalId: string;
    reason: string;
}
export declare class ListWithdrawalsDto {
    appId?: string;
    status?: string;
    userId?: string;
    pageNo?: number;
    limitVal?: number;
    startDate?: string;
    endDate?: string;
}
export declare class ExternalListWithdrawalsDto extends BaseAuthDto {
    status?: string;
    userId?: string;
    pageNo?: number;
    limitVal?: number;
    startDate?: string;
    endDate?: string;
}
export declare class GetBalanceDto extends BaseAuthDto {
}
export declare class GetWithdrawalStatusDto extends BaseAuthDto {
    withdrawalId: string;
}
export declare class UpdateWithdrawalSettingsDto {
    appId: string;
    isUserWithdrawalEnabled?: boolean;
    isAutoWithdrawalEnabled?: boolean;
    maxAutoWithdrawalLimit?: number;
    minWithdrawalAmount?: number;
    dailyWithdrawalRequestLimit?: number;
    dailyWithdrawalAmountLimit?: number;
    withdrawalCooldownMinutes?: number;
}
