import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Query,
    Param,
    Request,
    UseGuards,
} from "@nestjs/common";
import { UserWithdrawalService } from "./user-withdrawal.service";
import {
    CreateWithdrawalRequestDto,
    ApproveWithdrawalDto,
    DeclineWithdrawalDto,
    ListWithdrawalsDto,
    GetBalanceDto,
    UpdateWithdrawalSettingsDto,
    ExternalApproveWithdrawalDto,
    ExternalDeclineWithdrawalDto,
    ExternalListWithdrawalsDto,
    GetWithdrawalStatusDto,
} from "./dto/user-withdrawal.dto";
// import { ApiKeyAuthGuard } from "src/auth/guards/api-key-auth.guard";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("user-withdrawal")
export class UserWithdrawalController {
    constructor(private readonly userWithdrawalService: UserWithdrawalService) { }

    // ===============================================
    // External API Endpoints (API Key Authentication)
    // ===============================================

    /**
     * Create a new withdrawal request
     * POST /user-withdrawal/request
     * Body: appId, apiKey, secretKey + request details
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("request")
    async createWithdrawalRequest(
        @Body() dto: CreateWithdrawalRequestDto,
        // @Request() req
    ) {
        const app = await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.createWithdrawalRequest(dto, app);
    }

    /**
     * List withdrawal requests with filters
     * POST /user-withdrawal/list
     * Body: appId, apiKey, secretKey + filters
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("list")
    async listWithdrawals(@Body() dto: ExternalListWithdrawalsDto) {
        await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.listWithdrawals(dto);
    }

    /**
     * Get wallet balance for an app
     * POST /user-withdrawal/balance
     * Body: appId, apiKey, secretKey
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("balance")
    async getBalance(@Body() dto: GetBalanceDto) {
        await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.getWalletBalance(dto.appId);
    }

    /**
     * Approve a withdrawal request
     * POST /user-withdrawal/approve
     * Body: appId, apiKey, secretKey, withdrawalId
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("approve")
    async approveWithdrawal(@Body() dto: ExternalApproveWithdrawalDto) {
        const app = await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.approveWithdrawal(
            dto,
            app.merchantId.toString()
        );
    }

    /**
     * Decline a withdrawal request
     * POST /user-withdrawal/decline
     * Body: appId, apiKey, secretKey, withdrawalId, reason
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("decline")
    async declineWithdrawal(@Body() dto: ExternalDeclineWithdrawalDto) {
        const app = await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.declineWithdrawal(
            dto,
            app.merchantId.toString()
        );
    }

    /**
     * Get withdrawal status by ID
     * POST /user-withdrawal/status
     * Body: appId, apiKey, secretKey, withdrawalId
     */
    // @UseGuards(ApiKeyAuthGuard)
    @Post("status")
    async getWithdrawalStatus(@Body() dto: GetWithdrawalStatusDto) {
        const app = await this.userWithdrawalService.validateAppCredentials(
            dto.appId,
            dto.apiKey,
            dto.secretKey
        );
        return this.userWithdrawalService.getWithdrawalStatus(
            dto.withdrawalId,
            app.merchantId.toString()
        );
    }

    // ===============================================
    // Merchant Dashboard Endpoints (JWT Authentication)
    // ===============================================

    /**
     * List withdrawals for merchant dashboard
     * GET /user-withdrawal/merchant/list
     */
    @UseGuards(JwtAuthGuard)
    @Get("merchant/list")
    async merchantListWithdrawals(@Query() dto: ListWithdrawalsDto, @Request() req) {
        return this.userWithdrawalService.listWithdrawals(dto, req.user.userId);
    }

    /**
     * Get withdrawal history for merchant
     * GET /user-withdrawal/merchant/history
     */
    @UseGuards(JwtAuthGuard)
    @Get("merchant/history")
    async merchantWithdrawalHistory(
        @Query("pageNo") pageNo: number,
        @Query("limitVal") limitVal: number,
        @Query("status") status: string,
        @Request() req
    ) {
        return this.userWithdrawalService.getWithdrawalHistory(req.user.userId, {
            pageNo,
            limitVal,
            status,
        });
    }

    /**
     * Approve withdrawal from merchant dashboard
     * POST /user-withdrawal/merchant/approve
     */
    @UseGuards(JwtAuthGuard)
    @Post("merchant/approve")
    async merchantApproveWithdrawal(@Body() dto: ApproveWithdrawalDto, @Request() req) {
        return this.userWithdrawalService.approveWithdrawal(dto, req.user.userId);
    }

    /**
     * Decline withdrawal from merchant dashboard
     * POST /user-withdrawal/merchant/decline
     */
    @UseGuards(JwtAuthGuard)
    @Post("merchant/decline")
    async merchantDeclineWithdrawal(@Body() dto: DeclineWithdrawalDto, @Request() req) {
        return this.userWithdrawalService.declineWithdrawal(dto, req.user.userId);
    }

    /**
     * Update withdrawal settings for an app
     * PUT /user-withdrawal/merchant/settings
     */
    @UseGuards(JwtAuthGuard)
    @Put("merchant/settings")
    async updateWithdrawalSettings(
        @Body() dto: UpdateWithdrawalSettingsDto,
        @Request() req
    ) {
        return this.userWithdrawalService.updateWithdrawalSettings(
            dto,
            req.user.userId
        );
    }

    /**
     * Get withdrawal settings for an app
     * GET /user-withdrawal/merchant/settings
     */
    @UseGuards(JwtAuthGuard)
    @Get("merchant/settings")
    async getWithdrawalSettings(@Query("appId") appId: string, @Request() req) {
        // TODO: Implement getWithdrawalSettings in service
        return {
            success: true,
            message: "Feature coming soon",
        };
    }

    /**
     * Get wallet balance for an app (merchant dashboard)
     * GET /user-withdrawal/merchant/balance
     */
    @UseGuards(JwtAuthGuard)
    @Get("merchant/balance")
    async merchantGetBalance(@Query("appId") appId: string, @Request() req) {
        return this.userWithdrawalService.getWalletBalance(appId);
    }

    // ===============================================
    // Admin Dashboard Endpoints (JWT Authentication)
    // ===============================================

    /**
     * List all withdrawals for admin dashboard
     * GET /user-withdrawal/admin/list
     */
    @UseGuards(JwtAuthGuard)
    @Get("admin/list")
    async adminListWithdrawals(
        @Query("pageNo") pageNo: number = 1,
        @Query("limitVal") limitVal: number = 10,
        @Query("status") status?: string,
        @Query("merchantId") merchantId?: string,
        @Query("search") search?: string
    ) {
        return this.userWithdrawalService.adminListWithdrawals({
            pageNo,
            limitVal,
            status,
            merchantId,
            search,
        });
    }
}
