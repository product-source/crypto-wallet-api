import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsEmail,
    IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

// DTO for creating a withdrawal request via API
export class BaseAuthDto {
    @IsNotEmpty()
    @IsString()
    appId: string;

    @IsNotEmpty()
    @IsString()
    apiKey: string;

    @IsNotEmpty()
    @IsString()
    secretKey: string;
}

export class CreateWithdrawalRequestDto extends BaseAuthDto {
    @IsOptional()
    @IsString()
    appId: string;


    @IsString()
    @IsNotEmpty()
    userId: string; // Merchant's internal user ID

    @IsOptional()
    @IsEmail()
    userEmail?: string;

    @IsOptional()
    @IsString()
    userName?: string;

    @IsString()
    @IsNotEmpty()
    amount: string; // Amount in crypto

    @IsString()
    @IsNotEmpty()
    code: string; // Token Code (e.g. USDC.BNB)

    @IsString()
    @IsNotEmpty()
    walletAddress: string; // User's withdrawal address

    @IsOptional()
    @IsString()
    externalReference?: string; // Merchant's reference ID

    @IsOptional()
    @IsString()
    note?: string;
}

// DTO for approving a withdrawal
// DTO for approving a withdrawal (Merchant)
export class ApproveWithdrawalDto {
    @IsString()
    @IsNotEmpty()
    withdrawalId: string;

    @IsOptional()
    @IsString()
    note?: string;
}

// DTO for approving a withdrawal (External)
export class ExternalApproveWithdrawalDto extends BaseAuthDto {
    @IsString()
    @IsNotEmpty()
    withdrawalId: string;

    @IsOptional()
    @IsString()
    note?: string;
}

// DTO for declining a withdrawal
// DTO for declining a withdrawal (Merchant)
export class DeclineWithdrawalDto {
    @IsString()
    @IsNotEmpty()
    withdrawalId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}

// DTO for declining a withdrawal (External)
export class ExternalDeclineWithdrawalDto extends BaseAuthDto {
    @IsString()
    @IsNotEmpty()
    withdrawalId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}

// DTO for listing withdrawals
// DTO for listing withdrawals (Merchant / Shared structure)
export class ListWithdrawalsDto {
    @IsOptional()
    @IsString()
    appId?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNo?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limitVal?: number = 10;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}

// DTO for listing withdrawals (External API)
export class ExternalListWithdrawalsDto extends BaseAuthDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNo?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limitVal?: number = 10;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}

// DTO for getting wallet balance
// DTO for getting wallet balance (External)
export class GetBalanceDto extends BaseAuthDto {
    // appId is verified in BaseAuthDto
}

// DTO for getting withdrawal status
// DTO for getting withdrawal status (External)
export class GetWithdrawalStatusDto extends BaseAuthDto {
    @IsString()
    @IsNotEmpty()
    withdrawalId: string;
}

// DTO for updating withdrawal settings (merchant dashboard)
export class UpdateWithdrawalSettingsDto {
    @IsString()
    @IsNotEmpty()
    appId: string;

    @IsOptional()
    @IsBoolean()
    isUserWithdrawalEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    isAutoWithdrawalEnabled?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxAutoWithdrawalLimit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minWithdrawalAmount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    dailyWithdrawalRequestLimit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    dailyWithdrawalAmountLimit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    withdrawalCooldownMinutes?: number;
}
