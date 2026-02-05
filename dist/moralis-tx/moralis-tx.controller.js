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
exports.MoralisTxController = void 0;
const common_1 = require("@nestjs/common");
const moralis_tx_service_1 = require("./moralis-tx.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MoralisTxController = class MoralisTxController {
    constructor(moralisTxService) {
        this.moralisTxService = moralisTxService;
    }
    stream(tx) {
        return this.moralisTxService.stream(tx);
    }
    getTxList(query) {
        return this.moralisTxService.getTransactions(query);
    }
    getWithdrawTronPaymentFromLinks(query) {
        return this.moralisTxService.withdrawTronPaymentFromLinks();
    }
    checkBitcoinPaymentLinks(query) {
        return this.moralisTxService.processBitcoinPaymentLinks();
    }
    getWithdrawBTCPaymentFromLinksAndUpdateStatus() {
        return this.moralisTxService.withdrawBTCPaymentFromLinksAndUpdateStatus();
    }
    getTronBalance(query) {
        return this.moralisTxService.getTronBalanceAPI(query);
    }
    transferTRON(query) {
        return this.moralisTxService.transferTRONAPI(query);
    }
};
exports.MoralisTxController = MoralisTxController;
__decorate([
    (0, common_1.Post)("stream"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "stream", null);
__decorate([
    (0, common_1.Get)("tx-list"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "getTxList", null);
__decorate([
    (0, common_1.Get)("withdraw-tron-links"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "getWithdrawTronPaymentFromLinks", null);
__decorate([
    (0, common_1.Get)("check-bitcoin-links"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "checkBitcoinPaymentLinks", null);
__decorate([
    (0, common_1.Get)("withdraw-bitcoin-links"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "getWithdrawBTCPaymentFromLinksAndUpdateStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("tron-balance"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "getTronBalance", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("transfer-tron"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MoralisTxController.prototype, "transferTRON", null);
exports.MoralisTxController = MoralisTxController = __decorate([
    (0, common_1.Controller)("moralis-tx"),
    __metadata("design:paramtypes", [moralis_tx_service_1.TransactionService])
], MoralisTxController);
//# sourceMappingURL=moralis-tx.controller.js.map