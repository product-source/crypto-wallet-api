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
var TatumWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TatumWebhookController = void 0;
const common_1 = require("@nestjs/common");
const tatum_webhook_service_1 = require("./tatum-webhook.service");
let TatumWebhookController = TatumWebhookController_1 = class TatumWebhookController {
    constructor(tatumWebhookService) {
        this.tatumWebhookService = tatumWebhookService;
        this.logger = new common_1.Logger(TatumWebhookController_1.name);
    }
    async handleTronWebhook(body, signatureHeader) {
        this.logger.log(`[Tatum Webhook] Incoming Tron notification`);
        const isValid = this.tatumWebhookService.verifyHmacSignature(body, signatureHeader);
        if (!isValid) {
            this.logger.warn("[Tatum Webhook] Invalid HMAC signature. Rejecting.");
            return { status: "rejected", reason: "invalid_signature" };
        }
        return this.tatumWebhookService.handleTronWebhook(body);
    }
};
exports.TatumWebhookController = TatumWebhookController;
__decorate([
    (0, common_1.Post)("tron"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)("x-payload-hash")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TatumWebhookController.prototype, "handleTronWebhook", null);
exports.TatumWebhookController = TatumWebhookController = TatumWebhookController_1 = __decorate([
    (0, common_1.Controller)("tatum-webhook"),
    __metadata("design:paramtypes", [tatum_webhook_service_1.TatumWebhookService])
], TatumWebhookController);
//# sourceMappingURL=tatum-webhook.controller.js.map