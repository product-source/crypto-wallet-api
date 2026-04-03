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
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const admin_dto_1 = require("../admin/dto/admin.dto");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async adminLogin(dto) {
        return this.authService.adminLogin(dto);
    }
    async merchantLogin(dto) {
        return this.authService.merchantLogin(dto);
    }
    async verifyMerchantOTP(dto) {
        return this.authService.verifyMerchantOTP(dto);
    }
    async generate2FA(req) {
        return this.authService.generate2FASecret(req.user.userId);
    }
    async verify2FA(req, dto) {
        return this.authService.verifyAndEnable2FA(req.user.userId, dto.token);
    }
    async disable2FA(req, dto) {
        return this.authService.disable2FA(req.user.userId, dto.password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)("merchant-login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.MerchantLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "merchantLogin", null);
__decorate([
    (0, common_1.Post)("merchant-otp-verify"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.MerchantOTPDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMerchantOTP", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("2fa/generate"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generate2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("2fa/verify"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.Verify2FaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("2fa/disable"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.Disable2FaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2FA", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map