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
exports.WalletMonitorSchema = exports.WalletMonitor = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const apps_schema_1 = require("../../apps/schema/apps.schema");
const wallet_monitor_enum_1 = require("./wallet-monitor.enum");
const payment_link_schema_1 = require("../../payment-link/schema/payment-link.schema");
let WalletMonitor = class WalletMonitor {
};
exports.WalletMonitor = WalletMonitor;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: apps_schema_1.Apps.name,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], WalletMonitor.prototype, "appId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: payment_link_schema_1.PaymentLink.name,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], WalletMonitor.prototype, "paymentLinkId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WalletMonitor.prototype, "walletAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WalletMonitor.prototype, "expiryTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WalletMonitor.prototype, "walletType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Boolean)
], WalletMonitor.prototype, "isExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WalletMonitor.prototype, "tokenAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WalletMonitor.prototype, "chainId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WalletMonitor.prototype, "streamId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WalletMonitor.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WalletMonitor.prototype, "transactionType", void 0);
exports.WalletMonitor = WalletMonitor = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WalletMonitor);
exports.WalletMonitorSchema = mongoose_1.SchemaFactory.createForClass(WalletMonitor);
//# sourceMappingURL=wallet-monitor.schema.js.map