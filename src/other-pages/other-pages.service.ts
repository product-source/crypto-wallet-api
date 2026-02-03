import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { OtherPage, OtherPageDocument } from "./schema/other-pages.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { AddOtherPageDto, UpdateOtherPageDto } from "./dto/other-pages.dto";
import * as fs from "fs/promises";
import { join } from "path";

@Injectable()
export class OtherPagesService {
  constructor(
    @InjectModel(OtherPage.name)
    private readonly otherPageModel: Model<OtherPageDocument>
  ) {}

  async ensureDefaultOtherPageExist() {
    const otherPageCount = await this.otherPageModel.countDocuments();

    if (otherPageCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.otherpages.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const otherPageData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.otherPageModel.insertMany(otherPageData);
      console.log(
        "Default otherPage inserted successfully......................."
      );
    }
  }

  async addPage(dto: AddOtherPageDto) {
    try {
      const { name, slug, title, subTitle, description } = dto;
      const pageExist = await this.otherPageModel.findOne({ name });
      if (pageExist) {
        throw new NotAcceptableException("This page is already present");
      }
      const model = await new this.otherPageModel();
      model.name = name;
      model.slug = slug;
      model.title = title;
      model.subTitle = subTitle;
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
      const pages = await this.otherPageModel.find().sort({ _id: -1 });
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
      const page = await this.otherPageModel.findById(id);
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

  async viewApis() {
    try {
      const page = await this.otherPageModel.find({
        slug: { $in: ["api1", "api2"] },
      });

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

  async updateAPICard(dto: UpdateOtherPageDto) {
    try {
      const { id, title, subTitle, description } = dto;
      const page = await this.otherPageModel.findById(id);
      if (!page) {
        throw new NotFoundException("Invalid page Id");
      }
      if (title) page.title = title.trim();
      if (subTitle) page.subTitle = subTitle.trim();
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
      const page = await this.otherPageModel.findOne({ slug });
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
