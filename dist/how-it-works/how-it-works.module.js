"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HowItWorksModule = void 0;
const common_1 = require("@nestjs/common");
const how_it_works_service_1 = require("./how-it-works.service");
const how_it_works_controller_1 = require("./how-it-works.controller");
const mongoose_1 = require("@nestjs/mongoose");
const how_it_works_schema_1 = require("./schema/how-it-works.schema");
let HowItWorksModule = class HowItWorksModule {
};
exports.HowItWorksModule = HowItWorksModule;
exports.HowItWorksModule = HowItWorksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: how_it_works_schema_1.HowItWorks.name, schema: how_it_works_schema_1.HowItWorksSchema }]),
        ],
        controllers: [how_it_works_controller_1.HowItWorksController],
        providers: [how_it_works_service_1.HowItWorksService],
    })
], HowItWorksModule);
//# sourceMappingURL=how-it-works.module.js.map