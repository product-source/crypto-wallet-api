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
exports.UserWithdrawalSchema = exports.UserWithdrawal = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const apps_schema_1 = require("../../apps/schema/apps.schema");
const merchant_schema_1 = require("../../merchants/schema/merchant.schema");
const user_withdrawal_enum_1 = require("./user-withdrawal.enum");
let UserWithdrawal = class UserWithdrawal {
};
exports.UserWithdrawal = UserWithdrawal;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: apps_schema_1.Apps.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], UserWithdrawal.prototype, "appsId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: merchant_schema_1.Merchant.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], UserWithdrawal.prototype, "merchantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "userEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "userName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "tokenId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "tokenSymbol", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "chainId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "walletAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: user_withdrawal_enum_1.UserWithdrawalStatus.PENDING,
        enum: user_withdrawal_enum_1.UserWithdrawalStatus,
    }),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], UserWithdrawal.prototype, "merchantApprovedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], UserWithdrawal.prototype, "processedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "txHash", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "adminFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "failureReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "externalReference", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserWithdrawal.prototype, "declineReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], UserWithdrawal.prototype, "amountInUsd", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], UserWithdrawal.prototype, "insufficientFundsAtCreation", void 0);
exports.UserWithdrawal = UserWithdrawal = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], UserWithdrawal);
exports.UserWithdrawalSchema = mongoose_1.SchemaFactory.createForClass(UserWithdrawal);
exports.UserWithdrawalSchema.index({ appsId: 1, status: 1 });
exports.UserWithdrawalSchema.index({ appsId: 1, userId: 1, createdAt: -1 });
exports.UserWithdrawalSchema.index({ merchantId: 1, status: 1 });
//# sourceMappingURL=user-withdrawal.schema.js.map