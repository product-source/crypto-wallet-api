"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWithdrawalController = void 0;
const common_1 = require("@nestjs/common");
const user_withdrawal_service_1 = require("./user-withdrawal.service");
const user_withdrawal_dto_1 = require("./dto/user-withdrawal.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UserWithdrawalController = class UserWithdrawalController {
    constructor(userWithdrawalService) {
        this.userWithdrawalService = userWithdrawalService;
    }
    async createWithdrawalRequest(dto) {
        const app = await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.createWithdrawalRequest(dto, app);
    }
    async listWithdrawals(dto) {
        await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.listWithdrawals(dto);
    }
    async getBalance(dto) {
        await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.getWalletBalance(dto.appId);
    }
    async approveWithdrawal(dto) {
        const app = await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.approveWithdrawal(dto, app.merchantId.toString());
    }
    async declineWithdrawal(dto) {
        const app = await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.declineWithdrawal(dto, app.merchantId.toString());
    }
    async getWithdrawalStatus(dto) {
        const app = await this.userWithdrawalService.validateAppCredentials(dto.appId, dto.apiKey, dto.secretKey);
        return this.userWithdrawalService.getWithdrawalStatus(dto.withdrawalId, app.merchantId.toString());
    }
    async merchantListWithdrawals(dto, req) {
        return this.userWithdrawalService.listWithdrawals(dto, req.user.userId);
    }
    async merchantWithdrawalHistory(pageNo, limitVal, status, req) {
        return this.userWithdrawalService.getWithdrawalHistory(req.user.userId, {
            pageNo,
            limitVal,
            status,
        });
    }
    async merchantApproveWithdrawal(dto, req) {
        return this.userWithdrawalService.approveWithdrawal(dto, req.user.userId);
    }
    async merchantDeclineWithdrawal(dto, req) {
        return this.userWithdrawalService.declineWithdrawal(dto, req.user.userId);
    }
    async updateWithdrawalSettings(dto, req) {
        return this.userWithdrawalService.updateWithdrawalSettings(dto, req.user.userId);
    }
    async getWithdrawalSettings(appId, req) {
        return {
            success: true,
            message: "Feature coming soon",
        };
    }
    async merchantGetBalance(appId, req) {
        return this.userWithdrawalService.getWalletBalance(appId);
    }
    async adminListWithdrawals(pageNo = 1, limitVal = 10, status, merchantId, search) {
        return this.userWithdrawalService.adminListWithdrawals({
            pageNo,
            limitVal,
            status,
            merchantId,
            search,
        });
    }
};
exports.UserWithdrawalController = UserWithdrawalController;
__decorate([
    (0, common_1.Post)("request"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.CreateWithdrawalRequestDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "createWithdrawalRequest", null);
__decorate([
    (0, common_1.Post)("list"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.ExternalListWithdrawalsDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "listWithdrawals", null);
__decorate([
    (0, common_1.Post)("balance"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.GetBalanceDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)("approve"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.ExternalApproveWithdrawalDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Post)("decline"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.ExternalDeclineWithdrawalDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "declineWithdrawal", null);
__decorate([
    (0, common_1.Post)("status"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.GetWithdrawalStatusDto]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "getWithdrawalStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant/list"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.ListWithdrawalsDto, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "merchantListWithdrawals", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant/history"),
    __param(0, (0, common_1.Query)("pageNo")),
    __param(1, (0, common_1.Query)("limitVal")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "merchantWithdrawalHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("merchant/approve"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.ApproveWithdrawalDto, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "merchantApproveWithdrawal", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("merchant/decline"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.DeclineWithdrawalDto, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "merchantDeclineWithdrawal", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)("merchant/settings"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_withdrawal_dto_1.UpdateWithdrawalSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "updateWithdrawalSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant/settings"),
    __param(0, (0, common_1.Query)("appId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "getWithdrawalSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant/balance"),
    __param(0, (0, common_1.Query)("appId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "merchantGetBalance", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("admin/list"),
    __param(0, (0, common_1.Query)("pageNo")),
    __param(1, (0, common_1.Query)("limitVal")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("merchantId")),
    __param(4, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], UserWithdrawalController.prototype, "adminListWithdrawals", null);
exports.UserWithdrawalController = UserWithdrawalController = __decorate([
    (0, common_1.Controller)("user-withdrawal"),
    __metadata("design:paramtypes", [user_withdrawal_service_1.UserWithdrawalService])
], UserWithdrawalController);
//# sourceMappingURL=user-withdrawal.controller.js.map