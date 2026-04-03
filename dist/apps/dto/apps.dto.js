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
exports.RemoveWhitelistDto = exports.AddWhitelistDto = exports.RequestWhitelistOtpDto = exports.AppListDto = exports.UpdateAppsDto = exports.CreateAppsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateAppsDto {
}
exports.CreateAppsDto = CreateAppsDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppsDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppsDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["WHITE", "DARK"]),
    __metadata("design:type", String)
], CreateAppsDto.prototype, "theme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: "Tolerance margin cannot be less than 0%" }),
    (0, class_validator_1.Max)(100, { message: "Tolerance margin cannot be strictly greater than 100%" }),
    __metadata("design:type", Number)
], CreateAppsDto.prototype, "toleranceMargin", void 0);
class UpdateAppsDto {
}
exports.UpdateAppsDto = UpdateAppsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppsDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppsDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["WHITE", "DARK"]),
    __metadata("design:type", String)
], UpdateAppsDto.prototype, "theme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppsDto.prototype, "removeLogo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: "Tolerance margin cannot be less than 0%" }),
    (0, class_validator_1.Max)(100, { message: "Tolerance margin cannot be strictly greater than 100%" }),
    __metadata("design:type", Number)
], UpdateAppsDto.prototype, "toleranceMargin", void 0);
class AppListDto {
}
exports.AppListDto = AppListDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppListDto.prototype, "merchantId", void 0);
class RequestWhitelistOtpDto {
}
exports.RequestWhitelistOtpDto = RequestWhitelistOtpDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestWhitelistOtpDto.prototype, "appId", void 0);
class AddWhitelistDto {
}
exports.AddWhitelistDto = AddWhitelistDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "network", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWhitelistDto.prototype, "otp", void 0);
class RemoveWhitelistDto {
}
exports.RemoveWhitelistDto = RemoveWhitelistDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveWhitelistDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveWhitelistDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveWhitelistDto.prototype, "otp", void 0);
//# sourceMappingURL=apps.dto.js.map