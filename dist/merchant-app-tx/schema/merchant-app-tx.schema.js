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
exports.MerchantAppTxSchema = exports.MerchantAppTx = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const apps_schema_1 = require("../../apps/schema/apps.schema");
const payment_enum_1 = require("../../payment-link/schema/payment.enum");
const enum_1 = require("./enum");
class block {
}
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], block.prototype, "number", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], block.prototype, "hash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], block.prototype, "timestamp", void 0);
let MerchantAppTx = class MerchantAppTx {
};
exports.MerchantAppTx = MerchantAppTx;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: apps_schema_1.Apps.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], MerchantAppTx.prototype, "appsId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "blockNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: payment_enum_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: block, default: {} }),
    __metadata("design:type", block)
], MerchantAppTx.prototype, "block", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "hash", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "gas", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "gasPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "nonce", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "fromAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "tokenName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "tokenSymbol", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "tokenDecimals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "" }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "recivedAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "toAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "chainId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "symbol", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "APP" }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: enum_1.TransactionTypes.DEPOSIT }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "txType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "" }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "file", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "" }),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "invoice", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "adminFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "adminFeeWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MerchantAppTx.prototype, "adminFeeTxHash", void 0);
exports.MerchantAppTx = MerchantAppTx = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MerchantAppTx);
exports.MerchantAppTxSchema = mongoose_1.SchemaFactory.createForClass(MerchantAppTx);
//# sourceMappingURL=merchant-app-tx.schema.js.map