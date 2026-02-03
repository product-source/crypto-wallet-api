import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { HowItWorks, HowItWorksDocument } from "./schema/how-it-works.schema";
import {
  AddHowItWorksPageDto,
  UpdateHowItWorksPageDto,
} from "./dto/how-it-works.dto";
import * as fs from "fs/promises";
import { join } from "path";

@Injectable()
export class HowItWorksService {
  constructor(
    @InjectModel(HowItWorks.name)
    private readonly howItWorksModel: Model<HowItWorksDocument>
  ) {}

  async ensureDefaultWorkExist() {
    const workCount = await this.howItWorksModel.countDocuments();

    if (workCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.howitworks.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const HowItWorkData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.howItWorksModel.insertMany(HowItWorkData);
      console.log(
        "Default workCount inserted successfully......................."
      );
    }
  }

  async addPage(dto: AddHowItWorksPageDto) {
    try {
      const {
        name,
        slug,
        title,
        subTitle,
        heading1,
        description1,
        heading2,
        description2,
        heading3,
        description3,
        heading4,
        description4,
      } = dto;
      const pageExist = await this.howItWorksModel.findOne({ name });
      if (pageExist) {
        throw new NotAcceptableException("This page is already present");
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
      const pages = await this.howItWorksModel.find().sort({ _id: -1 });
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
      const page = await this.howItWorksModel.findById(id);
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

  async updatePage(dto: UpdateHowItWorksPageDto) {
    try {
      const {
        id,
        title,
        subTitle,
        heading1,
        description1,
        heading2,
        description2,
        heading3,
        description3,
        heading4,
        description4,
      } = dto;
      const page = await this.howItWorksModel.findById(id);
      if (!page) {
        throw new NotFoundException("Invalid page Id");
      }
      if (title) page.title = title.trim();
      if (subTitle) page.subTitle = subTitle.trim();
      if (heading1) page.heading1 = heading1.trim();
      if (description1) page.description1 = description1;
      if (heading2) page.heading2 = heading2.trim();
      if (description2) page.description2 = description2;
      if (heading3) page.heading3 = heading3.trim();
      if (description3) page.description3 = description3;

      if (heading4) page.heading4 = heading4.trim();
      if (description4) page.description4 = description4;

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
      const page = await this.howItWorksModel.findOne({ slug });
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
