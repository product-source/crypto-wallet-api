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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const admin_schema_1 = require("../admin/schema/admin.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const config_service_1 = require("../config/config.service");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(adminModel, merchantModel) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config_service_1.ConfigService.keys.JWT_SECRET,
        });
        this.adminModel = adminModel;
        this.merchantModel = merchantModel;
    }
    async validate(payload) {
        let user;
        user = await this.adminModel.findById({ _id: payload.userId });
        if (!user) {
            user = await this.merchantModel.findById({ _id: payload.userId });
            if (user.isAccountSuspend) {
                throw new common_1.UnauthorizedException("Your account is suspended.");
            }
        }
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return {
            userId: user._id,
            email: user.email,
            isAdmin: payload?.isAdmin,
            role: user.role || null,
            permissions: user.permissions || [],
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(admin_schema_1.Admin.name)),
    __param(1, (0, mongoose_2.InjectModel)(merchant_schema_1.Merchant.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map