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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSchema = exports.Admin = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const role_enum_1 = require("../../auth/enums/role.enum");
let Admin = class Admin {
};
exports.Admin = Admin;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Admin.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "countryCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "contactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Admin.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "verificationToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "platformFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "adminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "merchantFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "adminPrivateKey", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "tronPlatformFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "tronMerchantFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "tronAdminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "btcPlatformFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admin.prototype, "btcMerchantFee", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "btcAdminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "FiatEvmAdminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "FiatTronAdminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admin.prototype, "FiatbtcAdminWallet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: role_enum_1.Role, default: role_enum_1.Role.SUB_ADMIN }),
    __metadata("design:type", String)
], Admin.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: role_enum_1.Permission, default: [] }),
    __metadata("design:type", Array)
], Admin.prototype, "permissions", void 0);
exports.Admin = Admin = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Admin);
const AdminSchema = mongoose_1.SchemaFactory.createForClass(Admin);
exports.AdminSchema = AdminSchema;
AdminSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});
//# sourceMappingURL=admin.schema.js.map