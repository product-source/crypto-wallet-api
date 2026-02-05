"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtherPagesModule = void 0;
const common_1 = require("@nestjs/common");
const other_pages_service_1 = require("./other-pages.service");
const other_pages_controller_1 = require("./other-pages.controller");
const other_pages_schema_1 = require("./schema/other-pages.schema");
const mongoose_1 = require("@nestjs/mongoose");
let OtherPagesModule = class OtherPagesModule {
};
exports.OtherPagesModule = OtherPagesModule;
exports.OtherPagesModule = OtherPagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: other_pages_schema_1.OtherPage.name, schema: other_pages_schema_1.OtherPageSchema },
            ]),
        ],
        controllers: [other_pages_controller_1.OtherPagesController],
        providers: [other_pages_service_1.OtherPagesService],
    })
], OtherPagesModule);
//# sourceMappingURL=other-pages.module.js.map