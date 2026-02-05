"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const local_strategy_1 = require("../strategy/local.strategy");
const admin_schema_1 = require("../admin/schema/admin.schema");
const admin_service_1 = require("../admin/admin.service");
const config_service_1 = require("../config/config.service");
const hash_service_1 = require("../admin/hash.service");
const jwt_strategy_1 = require("../strategy/jwt.strategy");
const email_module_1 = require("../emails/email.module");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            mongoose_1.MongooseModule.forFeature([
                {
                    name: admin_schema_1.Admin.name,
                    schema: admin_schema_1.AdminSchema,
                },
                {
                    name: merchant_schema_1.Merchant.name,
                    schema: merchant_schema_1.MerchantSchema,
                },
            ]),
            jwt_1.JwtModule.register({
                secret: config_service_1.ConfigService.keys.JWT_SECRET,
                signOptions: {
                    expiresIn: "30h",
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            local_strategy_1.LocalStrategy,
            hash_service_1.HashService,
            admin_service_1.AdminService,
            jwt_strategy_1.JwtStrategy,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map