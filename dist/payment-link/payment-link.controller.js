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
exports.PaymentLinkController = void 0;
const common_1 = require("@nestjs/common");
const payment_link_service_1 = require("./payment-link.service");
const payment_link_dto_1 = require("./dto/payment-link.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let PaymentLinkController = class PaymentLinkController {
    constructor(paymentLinkService) {
        this.paymentLinkService = paymentLinkService;
    }
    addPaymentLink(dto, clientIp, req) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || clientIp;
        return this.paymentLinkService.addPaymentLink(dto, ip);
    }
    getWalletTransaction(query) {
        return this.paymentLinkService.getWalletERC20Transactions(query);
    }
    getMerchantTxList(query, req) {
        const { user } = req;
        return this.paymentLinkService.getMerchantTransactions(query, user);
    }
    getMerchantTxById(query) {
        return this.paymentLinkService.getMerchantTransactionById(query);
    }
    getAllPaymentLinks(query, req) {
        const { user } = req;
        return this.paymentLinkService.getAllPaymentLinks(query, user);
    }
    getPaymentLinksById(query) {
        return this.paymentLinkService.getPaymentLinksById(query);
    }
    paymentLinkCount(body) {
        return this.paymentLinkService.count(body);
    }
    adminFeeCount(body) {
        return this.paymentLinkService.revenue(body);
    }
    cryptoMargins(body) {
        return this.paymentLinkService.cryptoMargins(body);
    }
    depositsWithdrawalsCount(body) {
        return this.paymentLinkService.merchantDepositWithdrawals(body);
    }
    merchantPaymentLink(query) {
        return this.paymentLinkService.activePaymentLinks(query);
    }
    merchantActiveApps(query) {
        return this.paymentLinkService.activeMerchantApps(query);
    }
    depositTxFeeByAdmin(req, dto) {
        const { user } = req;
        return this.paymentLinkService.depositTxFeeByAdmin(user, dto);
    }
    withdrawFund(req, dto) {
        const { user } = req;
        return this.paymentLinkService.withdrawFund(user, dto);
    }
    getUserPaymentsLinksAmountSum(req) {
        const { user } = req;
        return this.paymentLinkService.getUserPaymentsLinksAmountSum(user);
    }
    getUserBalanceSum(query, req) {
        const { user } = req;
        return this.paymentLinkService.getUserBalanceSum(query, user);
    }
    getMerchantCryptoSymbols() {
        return this.paymentLinkService.getMerchantCryptoSymbols();
    }
    tablePaymentLinkCount(dto) {
        return this.paymentLinkService.tablePaymentLinkCount(dto);
    }
    tableMerchantDepositWithdrawCount(dto) {
        return this.paymentLinkService.tableMerchantDepositWithdrawCount(dto);
    }
    tableRevenueReportCount(dto) {
        return this.paymentLinkService.tableMerchantAppTxRevenueReports(dto);
    }
    tablePaymentLinkRevenueReportCount(dto) {
        return this.paymentLinkService.tablePaymentLinkRevenueReports(dto);
    }
    withdrawPaymentLinkFundsByAdmin(req, dto) {
        const { user } = req;
        return this.paymentLinkService.withdrawPaymentLinkFundsByAdmin(dto, user);
    }
    getPaymentLinkTronTokenBalance(req, dto) {
        const { user } = req;
        return this.paymentLinkService.getPaymentLinkTronTokenBalance(dto, user);
    }
};
exports.PaymentLinkController = PaymentLinkController;
__decorate([
    (0, common_1.Post)("add"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.AddPaymnetLinkDto, String, Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "addPaymentLink", null);
__decorate([
    (0, common_1.Get)("wallet-transaction"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getWalletTransaction", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant-tx-list"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getMerchantTxList", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant-tx-id"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getMerchantTxById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.PAYMENT_MANAGEMENT),
    (0, common_1.Get)("admin-all-payments"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getAllPaymentLinks", null);
__decorate([
    (0, common_1.Get)("get-tx-status"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getPaymentLinksById", null);
__decorate([
    (0, common_1.Post)("count"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "paymentLinkCount", null);
__decorate([
    (0, common_1.Post)("admin-fee-sum"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "adminFeeCount", null);
__decorate([
    (0, common_1.Post)("crypto-margins"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "cryptoMargins", null);
__decorate([
    (0, common_1.Post)("merchant-depositWithdraw"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "depositsWithdrawalsCount", null);
__decorate([
    (0, common_1.Get)("merchant-paymentLink"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "merchantPaymentLink", null);
__decorate([
    (0, common_1.Get)("merchant-apps"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "merchantActiveApps", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.PAYMENT_MANAGEMENT),
    (0, common_1.Post)("deposit-tx-fee-by-admin"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_link_dto_1.DepositFundDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "depositTxFeeByAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("withdraw-fund"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_link_dto_1.FundWithdrawDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "withdrawFund", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant-payment-links-fund"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getUserPaymentsLinksAmountSum", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("merchant-fund-sum"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getUserBalanceSum", null);
__decorate([
    (0, common_1.Get)("crypto-symbols"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getMerchantCryptoSymbols", null);
__decorate([
    (0, common_1.Post)("table-count-payment-links"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.TableDataDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "tablePaymentLinkCount", null);
__decorate([
    (0, common_1.Post)("table-count-merchant-deposit-withdraw"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.TableDataDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "tableMerchantDepositWithdrawCount", null);
__decorate([
    (0, common_1.Post)("table-merchant-app-revenue-report"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.TableDataDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "tableRevenueReportCount", null);
__decorate([
    (0, common_1.Post)("table-payment-link-revenue-report"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_link_dto_1.TableDataDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "tablePaymentLinkRevenueReportCount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.PAYMENT_MANAGEMENT),
    (0, common_1.Post)("admin-paymentlink-fund-withdraw"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_link_dto_1.FundWithdrawDto]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "withdrawPaymentLinkFundsByAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("get-tron-balance"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_link_dto_1.GetPaymentLinkTronBalance]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "getPaymentLinkTronTokenBalance", null);
exports.PaymentLinkController = PaymentLinkController = __decorate([
    (0, common_1.Controller)("payment-link"),
    __metadata("design:paramtypes", [payment_link_service_1.PaymentLinkService])
], PaymentLinkController);
//# sourceMappingURL=payment-link.controller.js.map