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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookLogSchema = exports.WebhookLog = exports.WebhookStatus = exports.WebhookEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const apps_schema_1 = require("../../apps/schema/apps.schema");
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["PAYMENT_INITIATED"] = "payment.initiated";
    WebhookEvent["PAYMENT_CONFIRMED"] = "payment.confirmed";
    WebhookEvent["PAYMENT_SUCCESS"] = "payment.success";
    WebhookEvent["PAYMENT_EXPIRED"] = "payment.expired";
    WebhookEvent["WITHDRAWAL_PENDING"] = "withdrawal.pending";
    WebhookEvent["WITHDRAWAL_AUTO_APPROVED"] = "withdrawal.auto_approved";
    WebhookEvent["WITHDRAWAL_APPROVED"] = "withdrawal.approved";
    WebhookEvent["WITHDRAWAL_PROCESSING"] = "withdrawal.processing";
    WebhookEvent["WITHDRAWAL_SUCCESS"] = "withdrawal.success";
    WebhookEvent["WITHDRAWAL_FAILED"] = "withdrawal.failed";
    WebhookEvent["WITHDRAWAL_DECLINED"] = "withdrawal.declined";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["PENDING"] = "PENDING";
    WebhookStatus["SUCCESS"] = "SUCCESS";
    WebhookStatus["FAILED"] = "FAILED";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
let WebhookLog = class WebhookLog {
};
exports.WebhookLog = WebhookLog;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: apps_schema_1.Apps.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], WebhookLog.prototype, "appId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WebhookLog.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(WebhookEvent) }),
    __metadata("design:type", String)
], WebhookLog.prototype, "event", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WebhookLog.prototype, "webhookUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], WebhookLog.prototype, "payload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: WebhookStatus.PENDING, enum: Object.values(WebhookStatus) }),
    __metadata("design:type", String)
], WebhookLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WebhookLog.prototype, "attempts", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], WebhookLog.prototype, "responseStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WebhookLog.prototype, "responseBody", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WebhookLog.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], WebhookLog.prototype, "nextRetryAt", void 0);
exports.WebhookLog = WebhookLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WebhookLog);
exports.WebhookLogSchema = mongoose_1.SchemaFactory.createForClass(WebhookLog);
//# sourceMappingURL=webhook-log.schema.js.map