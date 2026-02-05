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
exports.PagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pages_schema_1 = require("./schema/pages.schema");
const mongoose_2 = require("mongoose");
const path = __importStar(require("path"));
const uploadFile_schema_1 = require("./schema/uploadFile.schema");
const config_service_1 = require("../config/config.service");
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
let PagesService = class PagesService {
    constructor(pageModel, imageModel) {
        this.pageModel = pageModel;
        this.imageModel = imageModel;
    }
    async ensureDefaultPageExist() {
        const pageCount = await this.pageModel.countDocuments();
        if (pageCount === 0) {
            const filePath = (0, path_1.join)(process.cwd(), "src/utils/data", "coinpera-web.pages.json");
            const fileContent = await fs.readFile(filePath, "utf8");
            const rawTokensData = JSON.parse(fileContent);
            const pagesData = rawTokensData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
            await this.pageModel.insertMany(pagesData);
            console.log("Default pages inserted successfully.......................");
        }
    }
    async addPage(dto) {
        try {
            const { name, slug, title, subTitle, heading, description, otherValues, serviceHeading, serviceSubHeading, } = dto;
            const pageExist = await this.pageModel.findOne({ name });
            if (pageExist) {
                throw new common_1.NotAcceptableException("This page is already present");
            }
            const model = await new this.pageModel();
            model.name = name;
            model.slug = slug;
            model.title = title;
            model.subTitle = subTitle;
            model.heading = heading;
            model.description = description;
            model.otherValues = otherValues;
            model.serviceHeading = serviceHeading;
            model.serviceSubHeading = serviceSubHeading;
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
            const pages = await this.pageModel.find().sort({ _id: -1 });
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
            const page = await this.pageModel.findById(id);
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
            const { id, title, subTitle, heading, description, otherValues, serviceHeading, serviceSubHeading, } = dto;
            const page = await this.pageModel.findById(id);
            if (!page) {
                throw new common_1.NotFoundException("Invalid page Id");
            }
            if (title)
                page.title = title.trim();
            if (subTitle)
                page.subTitle = subTitle.trim();
            if (heading)
                page.heading = heading.trim();
            if (description)
                page.description = description;
            if (otherValues)
                page.otherValues = otherValues;
            if (serviceHeading)
                page.serviceHeading = serviceHeading;
            if (serviceSubHeading)
                page.serviceSubHeading = serviceSubHeading;
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
    async uploadFile(image) {
        try {
            const model = await new this.imageModel();
            if (image) {
                const imagePath = path.join("uploads/", image.filename);
                model.image = imagePath;
            }
            else {
                throw new common_1.NotAcceptableException("Image is required");
            }
            await model.save();
            const fileUrl = config_service_1.ConfigService.keys.BASE_URL + model.image;
            return {
                message: "Image added succesfully",
                uploaded: true,
                url: fileUrl,
                imageUrl: fileUrl,
            };
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
            const page = await this.pageModel.findOne({ slug });
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
exports.PagesService = PagesService;
exports.PagesService = PagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pages_schema_1.Page.name)),
    __param(1, (0, mongoose_1.InjectModel)(uploadFile_schema_1.UploadFile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PagesService);
//# sourceMappingURL=pages.service.js.map