"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiatCurrencyModule = void 0;
const common_1 = require("@nestjs/common");
const fiat_currency_service_1 = require("./fiat-currency.service");
const fiat_currency_controller_1 = require("./fiat-currency.controller");
const mongoose_1 = require("@nestjs/mongoose");
const fiat_currency_schema_1 = require("./schema/fiat-currency.schema");
let FiatCurrencyModule = class FiatCurrencyModule {
};
exports.FiatCurrencyModule = FiatCurrencyModule;
exports.FiatCurrencyModule = FiatCurrencyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: fiat_currency_schema_1.FiatCurrency.name, schema: fiat_currency_schema_1.FiatCurrencySchema },
            ]),
        ],
        controllers: [fiat_currency_controller_1.FiatCurrencyController],
        providers: [fiat_currency_service_1.FiatCurrencyService],
        exports: [fiat_currency_service_1.FiatCurrencyService],
    })
], FiatCurrencyModule);
//# sourceMappingURL=fiat-currency.module.js.map