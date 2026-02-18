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
exports.HowItWorksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const how_it_works_schema_1 = require("./schema/how-it-works.schema");
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
let HowItWorksService = class HowItWorksService {
    constructor(howItWorksModel) {
        this.howItWorksModel = howItWorksModel;
    }
    async ensureDefaultWorkExist() {
        const workCount = await this.howItWorksModel.countDocuments();
        if (workCount === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "coinpera-web.howitworks.json");
            const fileContent = await fs.readFile(filePath, "utf8");
            const rawTokensData = JSON.parse(fileContent);
            const HowItWorkData = rawTokensData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
            await this.howItWorksModel.insertMany(HowItWorkData);
            console.log("Default workCount inserted successfully.......................");
        }
    }
    async addPage(dto) {
        try {
            const { name, slug, title, subTitle, heading1, description1, heading2, description2, heading3, description3, heading4, description4, } = dto;
            const pageExist = await this.howItWorksModel.findOne({ name });
            if (pageExist) {
                throw new common_1.NotAcceptableException("This page is already present");
            }
            const model = await new this.howItWorksModel();
            model.name = name;
            model.slug = slug;
            model.title = title;
            model.subTitle = subTitle;
            model.heading1 = heading1;
            model.description1 = description1;
            model.heading2 = heading2;
            model.description2 = description2;
            model.heading3 = heading3;
            model.description3 = description3;
            model.heading4 = heading4;
            model.description4 = description4;
            await model.save();
            return { message: "page added succesfully" };
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
    async pagesList() {
        try {
            const pages = await this.howItWorksModel.find().sort({ _id: -1 });
            return { message: "Pages List", data: pages };
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
    async viewPage(id) {
        try {
            const page = await this.howItWorksModel.findById(id);
            if (!page) {
                throw new common_1.NotFoundException("Invalid Page Id");
            }
            return { message: "Page View", page };
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
    async updatePage(dto) {
        try {
            const { id, title, subTitle, heading1, description1, heading2, description2, heading3, description3, heading4, description4, } = dto;
            const page = await this.howItWorksModel.findById(id);
            if (!page) {
                throw new common_1.NotFoundException("Invalid page Id");
            }
            if (title)
                page.title = title.trim();
            if (subTitle)
                page.subTitle = subTitle.trim();
            if (heading1)
                page.heading1 = heading1.trim();
            if (description1)
                page.description1 = description1;
            if (heading2)
                page.heading2 = heading2.trim();
            if (description2)
                page.description2 = description2;
            if (heading3)
                page.heading3 = heading3.trim();
            if (description3)
                page.description3 = description3;
            if (heading4)
                page.heading4 = heading4.trim();
            if (description4)
                page.description4 = description4;
            await page.save();
            return { message: "Page Updated succesfully", data: page };
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
    async viewPageBySlug(slug) {
        try {
            const page = await this.howItWorksModel.findOne({ slug });
            if (!page) {
                throw new common_1.NotFoundException("Invalid Page");
            }
            return { message: "Page View", page };
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
exports.HowItWorksService = HowItWorksService;
exports.HowItWorksService = HowItWorksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(how_it_works_schema_1.HowItWorks.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], HowItWorksService);
//# sourceMappingURL=how-it-works.service.js.map