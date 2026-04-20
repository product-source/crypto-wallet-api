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
exports.SystemSettingsController = void 0;
const common_1 = require("@nestjs/common");
const system_settings_service_1 = require("./system-settings.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let SystemSettingsController = class SystemSettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getPaymentDomain() {
        const value = await this.settingsService.get('payment_link_domain');
        return { domain: value || 'https://paycoinz.com' };
    }
    async getAll() {
        return this.settingsService.getAll();
    }
    async get(key) {
        const value = await this.settingsService.get(key);
        return { key, value };
    }
    async set(key, value) {
        return this.settingsService.set(key, value);
    }
};
exports.SystemSettingsController = SystemSettingsController;
__decorate([
    (0, common_1.Get)('public/payment-domain'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getPaymentDomain", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('admin/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('admin/:key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('value')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "set", null);
exports.SystemSettingsController = SystemSettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [system_settings_service_1.SystemSettingsService])
], SystemSettingsController);
//# sourceMappingURL=system-settings.controller.js.map