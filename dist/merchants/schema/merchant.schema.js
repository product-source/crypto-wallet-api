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
exports.MerchantSchema = exports.Merchant = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const inquiry_schema_1 = require("../../inquiry/schema/inquiry.schema");
let Merchant = class Merchant {
};
exports.Merchant = Merchant;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: inquiry_schema_1.Inquiry.name,
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Merchant.prototype, "inquiryId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "platformName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "platformCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Merchant.prototype, "countryCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Merchant.prototype, "contactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Merchant.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Merchant.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isAccountCreated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "false" }),
    __metadata("design:type", String)
], Merchant.prototype, "acceptTermsConditions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Merchant.prototype, "verificationToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isAccountSuspend", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isMFA", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isNotification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Merchant.prototype, "twoFactorSecret", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isTwoFactorEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isGoogle2FA", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Merchant.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Merchant.prototype, "otpExpire", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Merchant.prototype, "totalFiatBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Merchant.prototype, "isIPWhitelistEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Merchant.prototype, "whitelistedIPs", void 0);
exports.Merchant = Merchant = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret) => {
                delete ret.password;
                return ret;
            },
        },
    })
], Merchant);
exports.MerchantSchema = mongoose_1.SchemaFactory.createForClass(Merchant);
//# sourceMappingURL=merchant.schema.js.map