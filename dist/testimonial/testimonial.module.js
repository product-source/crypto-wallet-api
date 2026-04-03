"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialModule = void 0;
const common_1 = require("@nestjs/common");
const testimonial_service_1 = require("./testimonial.service");
const testimonial_controller_1 = require("./testimonial.controller");
const mongoose_1 = require("@nestjs/mongoose");
const testimonial_schema_1 = require("./schema/testimonial.schema");
let TestimonialModule = class TestimonialModule {
};
exports.TestimonialModule = TestimonialModule;
exports.TestimonialModule = TestimonialModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: testimonial_schema_1.Testimonial.name, schema: testimonial_schema_1.TestimonialSchema },
            ]),
        ],
        controllers: [testimonial_controller_1.TestimonialController],
        providers: [testimonial_service_1.TestimonialService],
    })
], TestimonialModule);
//# sourceMappingURL=testimonial.module.js.map