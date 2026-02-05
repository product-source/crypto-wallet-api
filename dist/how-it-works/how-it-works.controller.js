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
exports.HowItWorksController = void 0;
const common_1 = require("@nestjs/common");
const how_it_works_service_1 = require("./how-it-works.service");
const how_it_works_dto_1 = require("./dto/how-it-works.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let HowItWorksController = class HowItWorksController {
    constructor(howItWorksService) {
        this.howItWorksService = howItWorksService;
    }
    addPage(dto) {
        return this.howItWorksService.addPage(dto);
    }
    list() {
        return this.howItWorksService.pagesList();
    }
    viewPage(query) {
        const { id } = query;
        return this.howItWorksService.viewPage(id);
    }
    async updatePage(dto) {
        return this.howItWorksService.updatePage(dto);
    }
    slugPage(query) {
        const { slug } = query;
        return this.howItWorksService.viewPageBySlug(slug);
    }
};
exports.HowItWorksController = HowItWorksController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Post)("add"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [how_it_works_dto_1.AddHowItWorksPageDto]),
    __metadata("design:returntype", void 0)
], HowItWorksController.prototype, "addPage", null);
__decorate([
    (0, common_1.Get)("list"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HowItWorksController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HowItWorksController.prototype, "viewPage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Put)("update"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [how_it_works_dto_1.UpdateHowItWorksPageDto]),
    __metadata("design:returntype", Promise)
], HowItWorksController.prototype, "updatePage", null);
__decorate([
    (0, common_1.Get)("slug"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HowItWorksController.prototype, "slugPage", null);
exports.HowItWorksController = HowItWorksController = __decorate([
    (0, common_1.Controller)('how-it-works'),
    __metadata("design:paramtypes", [how_it_works_service_1.HowItWorksService])
], HowItWorksController);
//# sourceMappingURL=how-it-works.controller.js.map