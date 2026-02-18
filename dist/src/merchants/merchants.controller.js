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
exports.MerchantsController = void 0;
const common_1 = require("@nestjs/common");
const merchants_service_1 = require("./merchants.service");
const merchant_dto_1 = require("./dto/merchant.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let MerchantsController = class MerchantsController {
    constructor(merchantsService) {
        this.merchantsService = merchantsService;
    }
    merchantList(query) {
        return this.merchantsService.getMerchants(query);
    }
    viewMerchant(query) {
        const { id } = query;
        return this.merchantsService.viewMerchant(id);
    }
    verifyUserMail(dto) {
        return this.merchantsService.verifyMail(dto);
    }
    resetUserPassword(dto) {
        return this.merchantsService.resetUserPassword(dto);
    }
    async userProfile(req) {
        const { user } = req;
        return this.merchantsService.userProfile(user);
    }
    updateProfile(dto, req) {
        const reqUser = req?.user;
        return this.merchantsService.updateUserProfile(dto, reqUser);
    }
    changePassword(req, dto) {
        const { user } = req;
        return this.merchantsService.changeUserPassword(user, dto);
    }
    changeStatus(dto) {
        return this.merchantsService.changeStatus(dto);
    }
    generateKey() {
        return this.merchantsService.generateKeys();
    }
    merchantCount() {
        return this.merchantsService.merchantCount();
    }
    async userPassword(req, dto) {
        const { user } = req;
        return this.merchantsService.checkPassword(user, dto);
    }
};
exports.MerchantsController = MerchantsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Get)("list"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "merchantList", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Get)("view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "viewMerchant", null);
__decorate([
    (0, common_1.Post)("verify-user-mail"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_dto_1.VerifyMailDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "verifyUserMail", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "resetUserPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("user-profile"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "userProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)("update-user-profile"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_dto_1.UpdateUserProfileDto, Object]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)("change-user-password"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dto_1.ChangeUserPasswordDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "changePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Post)("change-status"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_dto_1.StatusMerchantDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Get)("generate-keys"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "generateKey", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Get)("count"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "merchantCount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("check-password"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dto_1.checkPassword]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "userPassword", null);
exports.MerchantsController = MerchantsController = __decorate([
    (0, common_1.Controller)("merchants"),
    __metadata("design:paramtypes", [merchants_service_1.MerchantsService])
], MerchantsController);
//# sourceMappingURL=merchants.controller.js.map