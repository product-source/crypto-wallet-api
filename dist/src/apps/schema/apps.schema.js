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
exports.AppsSchema = exports.Apps = exports.EvmDetails = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const merchant_schema_1 = require("../../merchants/schema/merchant.schema");
class Mnemonic {
}
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], Mnemonic.prototype, "phrase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Mnemonic.prototype, "path", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Mnemonic.prototype, "locale", void 0);
class EvmDetails {
}
exports.EvmDetails = EvmDetails;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EvmDetails.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], EvmDetails.prototype, "privateKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Mnemonic, required: true, select: false }),
    __metadata("design:type", Mnemonic)
], EvmDetails.prototype, "mnemonic", void 0);
let Apps = class Apps {
};
exports.Apps = Apps;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: merchant_schema_1.Merchant.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Apps.prototype, "merchantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Apps.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Apps.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Apps.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Apps.prototype, "API_KEY", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Apps.prototype, "SECRET_KEY", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EvmDetails, default: {} }),
    __metadata("design:type", EvmDetails)
], Apps.prototype, "EVMWalletMnemonic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EvmDetails, default: {} }),
    __metadata("design:type", EvmDetails)
], Apps.prototype, "TronWalletMnemonic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EvmDetails, default: {} }),
    __metadata("design:type", EvmDetails)
], Apps.prototype, "BtcWalletMnemonic", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Apps.prototype, "currentIndexVal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "tronCurrentIndexVal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "btcCurrentIndexVal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "totalFiatBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "DARK", enum: ["WHITE", "DARK"] }),
    __metadata("design:type", String)
], Apps.prototype, "theme", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Apps.prototype, "webhookUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Apps.prototype, "webhookSecret", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Apps.prototype, "isUserWithdrawalEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Apps.prototype, "isAutoWithdrawalEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 100 }),
    __metadata("design:type", Number)
], Apps.prototype, "maxAutoWithdrawalLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "minWithdrawalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "dailyWithdrawalRequestLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "dailyWithdrawalAmountLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Apps.prototype, "withdrawalCooldownMinutes", void 0);
exports.Apps = Apps = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                if (ret.EVMWalletMnemonic) {
                    delete ret.EVMWalletMnemonic.privateKey;
                    delete ret.EVMWalletMnemonic.mnemonic;
                }
                if (ret.TronWalletMnemonic) {
                    delete ret.TronWalletMnemonic.privateKey;
                    delete ret.TronWalletMnemonic.mnemonic;
                }
                if (ret.BtcWalletMnemonic) {
                    delete ret.BtcWalletMnemonic.privateKey;
                    delete ret.BtcWalletMnemonic.mnemonic;
                }
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret) => {
                if (ret.EVMWalletMnemonic) {
                    delete ret.EVMWalletMnemonic.privateKey;
                    delete ret.EVMWalletMnemonic.mnemonic;
                }
                if (ret.TronWalletMnemonic) {
                    delete ret.TronWalletMnemonic.privateKey;
                    delete ret.TronWalletMnemonic.mnemonic;
                }
                if (ret.BtcWalletMnemonic) {
                    delete ret.BtcWalletMnemonic.privateKey;
                    delete ret.BtcWalletMnemonic.mnemonic;
                }
                return ret;
            },
        },
    })
], Apps);
exports.AppsSchema = mongoose_1.SchemaFactory.createForClass(Apps);
//# sourceMappingURL=apps.schema.js.map