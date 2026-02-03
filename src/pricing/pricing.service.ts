import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Pricing, PricingDocument } from "./schema/pricing.schema";
import { AddPricingPageDto, UpdatePricingPageDto } from "./dto/pricing.dto";
import * as fs from "fs/promises";
import { join } from "path";

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(Pricing.name)
    private readonly pricingModel: Model<PricingDocument>
  ) {}

  async ensureDefaultPricingExist() {
    const pricingCount = await this.pricingModel.countDocuments();

    if (pricingCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.pricings.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const pricingData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.pricingModel.insertMany(pricingData);
      console.log(
        "Default pricing inserted successfully......................."
      );
    }
  }

  async addPage(dto: AddPricingPageDto) {
    try {
      const { name, slug, title, pricing, description } = dto;
      const pageExist = await this.pricingModel.findOne({ title });
      if (pageExist) {
        throw new NotAcceptableException("This page is already present");
      }
      const model = await new this.pricingModel();
      model.name = name;
      model.slug = slug;
      model.title = title;
      model.pricing = pricing;
      model.description = description;
      await model.save();
      return { message: "page added succesfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async pagesList() {
    try {
      const pages = await this.pricingModel.find();
      return { message: "Pages List", data: pages };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async viewPage(id) {
    try {
      const page = await this.pricingModel.findById(id);
      if (!page) {
        throw new NotFoundException("Invalid Page Id");
      }
      return { message: "Page View", page };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async updatePage(dto: UpdatePricingPageDto) {
    try {
      const { id, title, pricing, description } = dto;
      const page = await this.pricingModel.findById(id);
      if (!page) {
        throw new NotFoundException("Invalid page Id");
      }
      if (title) page.title = title.trim();
      if (pricing) page.pricing = pricing.trim();
      if (description) page.description = description;

      await page.save();
      return { message: "Page Updated succesfully", data: page };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async viewPageBySlug(slug) {
    try {
      const page = await this.pricingModel.findOne({ slug });
      if (!page) {
        throw new NotFoundException("Invalid Page");
      }
      return { message: "Page View", page };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
}
