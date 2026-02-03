import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Page, PageDocument } from "./schema/pages.schema";
import { Model } from "mongoose";
import { AddPageDto, UpdatePageDto } from "./dto/pages.dto";
import * as path from "path";
import { UploadFile, UploadFileDocument } from "./schema/uploadFile.schema";
import { ConfigService } from "src/config/config.service";
import * as fs from "fs/promises";
import { join } from "path";

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Page.name)
    private readonly pageModel: Model<PageDocument>,
    @InjectModel(UploadFile.name)
    private readonly imageModel: Model<UploadFileDocument>
  ) {}

  async ensureDefaultPageExist() {
    const pageCount = await this.pageModel.countDocuments();

    if (pageCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.pages.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const pagesData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.pageModel.insertMany(pagesData);
      console.log("Default pages inserted successfully.......................");
    }
  }

  async addPage(dto: AddPageDto) {
    try {
      const {
        name,
        slug,
        title,
        subTitle,
        heading,
        description,
        otherValues,
        serviceHeading,
        serviceSubHeading,
      } = dto;
      const pageExist = await this.pageModel.findOne({ name });
      if (pageExist) {
        throw new NotAcceptableException("This page is already present");
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
      const pages = await this.pageModel.find().sort({ _id: -1 });
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
      const page = await this.pageModel.findById(id);
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

  // async updatePage(dto: UpdatePageDto, image: Express.Multer.File) {
  //   try {
  //     const { id, title, description } = dto;
  //     const page = await this.pageModel.findById(id);
  //     if (!page) {
  //       throw new NotFoundException("Invalid page Id");
  //     }
  //     if (title) page.title = title;
  //     if (description) page.description = description;

  //     if (image) {
  //       const imagePath = path.join("uploads/", image.filename);
  //       page.image = imagePath;
  //     }

  //     await page.save();
  //     return { message: "Page Updated succesfully", data: page };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     } else {
  //       console.log("An error occurred:", error.message);
  //       throw new InternalServerErrorException(error);
  //     }
  //   }
  // }

  async updatePage(dto: UpdatePageDto) {
    try {
      const {
        id,
        title,
        subTitle,
        heading,
        description,
        otherValues,
        serviceHeading,
        serviceSubHeading,
      } = dto;
      const page = await this.pageModel.findById(id);
      if (!page) {
        throw new NotFoundException("Invalid page Id");
      }
      if (title) page.title = title.trim();
      if (subTitle) page.subTitle = subTitle.trim();
      if (heading) page.heading = heading.trim();
      if (description) page.description = description;
      if (otherValues) page.otherValues = otherValues;
      if (serviceHeading) page.serviceHeading = serviceHeading;
      if (serviceSubHeading) page.serviceSubHeading = serviceSubHeading;
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

  async uploadFile(image: Express.Multer.File) {
    try {
      const model = await new this.imageModel();
      if (image) {
        const imagePath = path.join("uploads/", image.filename);
        model.image = imagePath;
      } else {
        throw new NotAcceptableException("Image is required");
      }
      await model.save();
      const fileUrl = ConfigService.keys.BASE_URL + model.image;
      return {
        message: "Image added succesfully",
        uploaded: true,
        url: fileUrl,
        imageUrl: fileUrl,
      };
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
      const page = await this.pageModel.findOne({ slug });
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
