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
exports.MerchantAppTxController = void 0;
const common_1 = require("@nestjs/common");
const merchant_app_tx_service_1 = require("./merchant-app-tx.service");
const merchant_app_tx_dto_1 = require("./dto/merchant-app-tx.dto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let MerchantAppTxController = class MerchantAppTxController {
    constructor(merchantAppTxService) {
        this.merchantAppTxService = merchantAppTxService;
    }
    async generatePdf() {
        try {
            const data = {
                invoice_no: "vishal",
                date: "12-10-2015",
                merchant_id: "merchant_id 985",
                merchant_name: "rahul merchant",
                sender_address: "sender address",
                receiver_address: "receiver address",
                app_id: "TestApp",
                app_name: "app_name",
                email: "email",
                chainId: "chainId",
                hash: "0x..kjasjdfasjdfsa",
                value: "85",
                platform_fee: "5.25",
                adminCharges: "5.2",
                token_name: "USDT",
                withdrawAmount: "9.5",
            };
            const fullPath = await this.merchantAppTxService.generatePdf(data);
            console.log("Generated PDF file: ", fullPath);
            return fullPath;
        }
        catch (error) {
            console.error("Error generating PDF:", error.message);
            throw new Error("Error generating PDF");
        }
    }
    async addTransaction(req, dto, file) {
        const { user } = req;
        const addTransactionDto = (0, class_transformer_1.plainToClass)(merchant_app_tx_dto_1.AddTransactionDto, dto);
        await (0, class_validator_1.validateOrReject)(addTransactionDto);
        if (file) {
            const profilePicUrl = await this.merchantAppTxService.uploadFile(file);
            addTransactionDto.file = profilePicUrl;
        }
        return this.merchantAppTxService.addTransaction(user, addTransactionDto, file);
    }
    getMerchantTxList(query, req) {
        const { user } = req;
        return this.merchantAppTxService.getMerchatAppsAllTx(query, user);
    }
    getTxList(query) {
        return this.merchantAppTxService.getAppTx(query);
    }
    getAppIdTxList(query) {
        return this.merchantAppTxService.getAppIdTxList(query);
    }
    merchantWithdraw(req, dto) {
        const { user } = req;
        return this.merchantAppTxService.merchantWithdraw(user, dto);
    }
    merchantFiatWithdraw(req, dto) {
        const { user } = req;
        console.log("USERR ", user);
        return this.merchantAppTxService.merchantWithdrawFiat(user, dto);
    }
    merchantFiatWithdrawList(req, query) {
        const { user } = req;
        return this.merchantAppTxService.getmerchantWithdrawFiatTxList(user, query);
    }
    merchantFiatWithdrawListinAdmin(req, query) {
        const { user } = req;
        return this.merchantAppTxService.getmerchantWithdrawFiatTxListinAdmin(user, query);
    }
    adminFiatTransfer(req, query, dto) {
        const { user } = req;
        return this.merchantAppTxService.adminFiatTransfer(query, dto);
    }
    viewFiatWithdrawl(req, query) {
        const { user } = req;
        return this.merchantAppTxService.viewFiatTransactionById(query);
    }
};
exports.MerchantAppTxController = MerchantAppTxController;
__decorate([
    (0, common_1.Get)("generate"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MerchantAppTxController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Post)("add"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MerchantAppTxController.prototype, "addTransaction", null);
__decorate([
    (0, common_1.Get)("merchant-tx-list"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "getMerchantTxList", null);
__decorate([
    (0, common_1.Get)("tx-list"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "getTxList", null);
__decorate([
    (0, common_1.Get)("get-appid-transaction"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "getAppIdTxList", null);
__decorate([
    (0, common_1.Post)("merchant-withdraw"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_app_tx_dto_1.CryptoTransaction]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "merchantWithdraw", null);
__decorate([
    (0, common_1.Post)("merchant-fiat-withdraw"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_app_tx_dto_1.WithdrawFiat]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "merchantFiatWithdraw", null);
__decorate([
    (0, common_1.Get)("merchant-fiat-withdraw-list"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "merchantFiatWithdrawList", null);
__decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.FIAT_TRANSACTIONS),
    (0, common_1.Get)("merchant-fiat-withdraw-list-admin"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "merchantFiatWithdrawListinAdmin", null);
__decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.FIAT_TRANSACTIONS),
    (0, common_1.Post)("admin-fiat-transfer"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, merchant_app_tx_dto_1.adminFiatTransferDto]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "adminFiatTransfer", null);
__decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.FIAT_TRANSACTIONS),
    (0, common_1.Get)("view-fiat-withdrawl"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MerchantAppTxController.prototype, "viewFiatWithdrawl", null);
exports.MerchantAppTxController = MerchantAppTxController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("merchant-app-tx"),
    __metadata("design:paramtypes", [merchant_app_tx_service_1.MerchantAppTxService])
], MerchantAppTxController);
//# sourceMappingURL=merchant-app-tx.controller.js.map