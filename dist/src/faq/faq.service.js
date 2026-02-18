"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const faq_schema_1 = require("./schema/faq.schema");
const mongoose_2 = require("mongoose");
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
let FaqService = class FaqService {
    constructor(faqModel) {
        this.faqModel = faqModel;
    }
    async ensureDefaultFaqExist() {
        const tokenCount = await this.faqModel.countDocuments();
        if (tokenCount === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "coinpera-web.faqs.json");
            const fileContent = await fs.readFile(filePath, "utf8");
            const rawTokensData = JSON.parse(fileContent);
            const faqData = rawTokensData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
            await this.faqModel.insertMany(faqData);
            console.log("Default faq inserted successfully.......................");
        }
    }
    async addFaq(dto) {
        try {
            const { question, answer } = dto;
            const model = await new this.faqModel();
            model.question = question.trim();
            model.answer = answer.trim();
            await model.save();
            return { message: "faq added succesfully" };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async faqList() {
        try {
            const faq = await this.faqModel.find().sort({ _id: -1 });
            return { message: "faq List", data: faq };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async viewFaq(id) {
        try {
            const faq = await this.faqModel.findById(id);
            if (!faq) {
                throw new common_1.NotFoundException("Invalid faq Id");
            }
            return { message: "faq View", faq };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async updateFaq(dto) {
        try {
            const { id, question, answer } = dto;
            const faq = await this.faqModel.findById(id);
            if (!faq) {
                throw new common_1.NotFoundException("Invalid faq Id");
            }
            if (question)
                faq.question = question.trim();
            if (answer)
                faq.answer = answer.trim();
            await faq.save();
            return { message: "faq Updated succesfully", data: faq };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async deleteFaq(id) {
        try {
            const faq = await this.faqModel.findByIdAndDelete(id);
            if (!faq) {
                throw new common_1.NotFoundException("Invalid faq Id");
            }
            return { message: "faq deleted" };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
};
exports.FaqService = FaqService;
exports.FaqService = FaqService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(faq_schema_1.Faq.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FaqService);
//# sourceMappingURL=faq.service.js.map