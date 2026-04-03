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
exports.FiatWithdrawSchema = exports.FiatWithdraw = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const apps_schema_1 = require("../../apps/schema/apps.schema");
const merchant_schema_1 = require("../../merchants/schema/merchant.schema");
const payment_enum_1 = require("../../payment-link/schema/payment.enum");
let FiatWithdraw = class FiatWithdraw {
};
exports.FiatWithdraw = FiatWithdraw;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: apps_schema_1.Apps.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], FiatWithdraw.prototype, "appsId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: merchant_schema_1.Merchant.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], FiatWithdraw.prototype, "merchantId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], FiatWithdraw.prototype, "totalFiatBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], FiatWithdraw.prototype, "minimumWithdrawl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], FiatWithdraw.prototype, "withdrawlAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FiatWithdraw.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], FiatWithdraw.prototype, "cryptoValue", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FiatWithdraw.prototype, "walletAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FiatWithdraw.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: payment_enum_1.WithdrawlFiatPaymentStatus.PENDING }),
    __metadata("design:type", String)
], FiatWithdraw.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], FiatWithdraw.prototype, "transferDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FiatWithdraw.prototype, "txHash", void 0);
exports.FiatWithdraw = FiatWithdraw = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], FiatWithdraw);
exports.FiatWithdrawSchema = mongoose_1.SchemaFactory.createForClass(FiatWithdraw);
//# sourceMappingURL=fiat-withdraw.schema.js.map