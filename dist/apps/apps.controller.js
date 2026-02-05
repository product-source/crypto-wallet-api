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
exports.AppsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const apps_service_1 = require("./apps.service");
const apps_dto_1 = require("./dto/apps.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
const webhook_dto_1 = require("../webhook/dto/webhook.dto");
const webhook_service_1 = require("../webhook/webhook.service");
let AppsController = class AppsController {
    constructor(appsService, webhookService) {
        this.appsService = appsService;
        this.webhookService = webhookService;
    }
    addApp(req, dto, file) {
        const { user } = req;
        return this.appsService.addApp(user, dto, file);
    }
    getApp(req, query) {
        const { user } = req;
        return this.appsService.getApps(user, query);
    }
    getAppById(req, query) {
        const { user } = req;
        return this.appsService.appById(user, query);
    }
    getKeys(req, query) {
        const { user } = req;
        return this.appsService.getKeys(user, query);
    }
    updateApp(req, query, dto, file) {
        const { user } = req;
        return this.appsService.updateApp(user, query, dto, file);
    }
    deleteApp(req, query) {
        const { user } = req;
        return this.appsService.deleteApp(user, query);
    }
    getUnreadNotificationCount(req) {
        const { user } = req;
        return this.appsService.getUnreadNotificationCount(user);
    }
    appList(query) {
        return this.appsService.appList(query);
    }
    viewMerchantApp(query) {
        const { id } = query;
        return this.appsService.viewMerchantApp(id);
    }
    updateWebhook(dto) {
        return this.appsService.updateWebhookWithApiKey(dto);
    }
    getWebhookLogs(dto) {
        return this.appsService.getWebhookLogsWithApiKey(dto);
    }
};
exports.AppsController = AppsController;
__decorate([
    (0, common_1.Post)("add"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("logo", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads/apps",
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join("");
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
                return cb(new common_1.BadRequestException("Only image files (jpg, jpeg, png) are allowed!"), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, apps_dto_1.CreateAppsDto, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "addApp", null);
__decorate([
    (0, common_1.Get)("get"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "getApp", null);
__decorate([
    (0, common_1.Get)("getById"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "getAppById", null);
__decorate([
    (0, common_1.Get)("keys"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "getKeys", null);
__decorate([
    (0, common_1.Put)("update"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("logo", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads/apps",
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join("");
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
                return cb(new common_1.BadRequestException("Only image files (jpg, jpeg, png) are allowed!"), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, apps_dto_1.UpdateAppsDto, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "updateApp", null);
__decorate([
    (0, common_1.Delete)("delete"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "deleteApp", null);
__decorate([
    (0, common_1.Get)("unread-notification-count"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "getUnreadNotificationCount", null);
__decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Get)("list"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "appList", null);
__decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(role_enum_1.Permission.MERCHANT_MANAGEMENT),
    (0, common_1.Get)("view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "viewMerchantApp", null);
__decorate([
    (0, common_1.Post)("webhook/update"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhook_dto_1.UpdateWebhookDto]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "updateWebhook", null);
__decorate([
    (0, common_1.Post)("webhook/logs"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhook_dto_1.GetWebhookLogsDto]),
    __metadata("design:returntype", void 0)
], AppsController.prototype, "getWebhookLogs", null);
exports.AppsController = AppsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("apps"),
    __metadata("design:paramtypes", [apps_service_1.AppsService,
        webhook_service_1.WebhookService])
], AppsController);
//# sourceMappingURL=apps.controller.js.map