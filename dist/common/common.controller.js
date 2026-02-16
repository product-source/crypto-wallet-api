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
exports.CommonController = void 0;
const common_1 = require("@nestjs/common");
const helper_1 = require("../helpers/helper");
let CommonController = class CommonController {
    async getPrice(currency, symbol) {
        if (symbol.includes(",")) {
            const symbols = symbol.split(",");
            const result = {};
            await Promise.all(symbols.map(async (s) => {
                const cleanSymbol = s.trim().toUpperCase();
                const price = await (0, helper_1.getTatumPrice)(cleanSymbol, currency);
                result[cleanSymbol] = price;
            }));
            return { success: true, data: result };
        }
        else {
            const cleanSymbol = symbol.trim().toUpperCase();
            const price = await (0, helper_1.getTatumPrice)(cleanSymbol, currency);
            return { success: true, data: { [cleanSymbol]: price } };
        }
    }
};
exports.CommonController = CommonController;
__decorate([
    (0, common_1.Post)("price"),
    __param(0, (0, common_1.Body)("currency")),
    __param(1, (0, common_1.Body)("symbol")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommonController.prototype, "getPrice", null);
exports.CommonController = CommonController = __decorate([
    (0, common_1.Controller)("common")
], CommonController);
//# sourceMappingURL=common.controller.js.map