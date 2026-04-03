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
exports.OtherPagesController = void 0;
const common_1 = require("@nestjs/common");
const other_pages_service_1 = require("./other-pages.service");
const other_pages_dto_1 = require("./dto/other-pages.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let OtherPagesController = class OtherPagesController {
    constructor(otherPagesService) {
        this.otherPagesService = otherPagesService;
    }
    addPage(dto) {
        return this.otherPagesService.addPage(dto);
    }
    list() {
        return this.otherPagesService.pagesList();
    }
    viewPage(query) {
        const { id } = query;
        return this.otherPagesService.viewPage(id);
    }
    async updatePage(dto) {
        return this.otherPagesService.updateAPICard(dto);
    }
    slugPage(query) {
        const { slug } = query;
        return this.otherPagesService.viewPageBySlug(slug);
    }
    viewAPIs() {
        return this.otherPagesService.viewApis();
    }
};
exports.OtherPagesController = OtherPagesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Post)("add"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [other_pages_dto_1.AddOtherPageDto]),
    __metadata("design:returntype", void 0)
], OtherPagesController.prototype, "addPage", null);
__decorate([
    (0, common_1.Get)("list"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OtherPagesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtherPagesController.prototype, "viewPage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Put)("update-api"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [other_pages_dto_1.UpdateOtherPageDto]),
    __metadata("design:returntype", Promise)
], OtherPagesController.prototype, "updatePage", null);
__decorate([
    (0, common_1.Get)("slug"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtherPagesController.prototype, "slugPage", null);
__decorate([
    (0, common_1.Get)("apis"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OtherPagesController.prototype, "viewAPIs", null);
exports.OtherPagesController = OtherPagesController = __decorate([
    (0, common_1.Controller)("other-pages"),
    __metadata("design:paramtypes", [other_pages_service_1.OtherPagesService])
], OtherPagesController);
//# sourceMappingURL=other-pages.controller.js.map