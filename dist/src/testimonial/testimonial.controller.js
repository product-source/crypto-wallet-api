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
exports.TestimonialController = void 0;
const common_1 = require("@nestjs/common");
const testimonial_service_1 = require("./testimonial.service");
const testimonial_dto_1 = require("./dto/testimonial.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
let TestimonialController = class TestimonialController {
    constructor(testimonialService) {
        this.testimonialService = testimonialService;
    }
    addPage(dto) {
        return this.testimonialService.addPage(dto);
    }
    list() {
        return this.testimonialService.pagesList();
    }
    viewPage(query) {
        const { id } = query;
        return this.testimonialService.viewPage(id);
    }
    async updatePage(dto) {
        return this.testimonialService.updatePage(dto);
    }
    slugPage(query) {
        const { slug } = query;
        return this.testimonialService.viewPageBySlug(slug);
    }
};
exports.TestimonialController = TestimonialController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Post)("add"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [testimonial_dto_1.AddTestimonialDto]),
    __metadata("design:returntype", void 0)
], TestimonialController.prototype, "addPage", null);
__decorate([
    (0, common_1.Get)("list"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestimonialController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestimonialController.prototype, "viewPage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.CONTENT_MANAGEMENT),
    (0, common_1.Put)("update"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [testimonial_dto_1.UpdateTestimonialDto]),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "updatePage", null);
__decorate([
    (0, common_1.Get)("slug"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestimonialController.prototype, "slugPage", null);
exports.TestimonialController = TestimonialController = __decorate([
    (0, common_1.Controller)("testimonial"),
    __metadata("design:paramtypes", [testimonial_service_1.TestimonialService])
], TestimonialController);
//# sourceMappingURL=testimonial.controller.js.map