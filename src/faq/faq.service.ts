import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Faq, FaqDocument } from "./schema/faq.schema";
import { AddFaqDto, UpdateFaqDto } from "./dto/faq.dto";
import { Model } from "mongoose";
import * as fs from "fs/promises";
import { join } from "path";

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq.name)
    private readonly faqModel: Model<FaqDocument>
  ) {}

  async ensureDefaultFaqExist() {
    const tokenCount = await this.faqModel.countDocuments();

    if (tokenCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.faqs.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const faqData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      await this.faqModel.insertMany(faqData);
      console.log("Default faq inserted successfully.......................");
    }
  }

  async addFaq(dto: AddFaqDto) {
    try {
      const { question, answer } = dto;
      const model = await new this.faqModel();
      model.question = question.trim();
      model.answer = answer.trim();
      await model.save();
      return { message: "faq added succesfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async faqList() {
    try {
      const faq = await this.faqModel.find().sort({ _id: -1 });
      return { message: "faq List", data: faq };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async viewFaq(id) {
    try {
      const faq = await this.faqModel.findById(id);
      if (!faq) {
        throw new NotFoundException("Invalid faq Id");
      }
      return { message: "faq View", faq };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async updateFaq(dto: UpdateFaqDto) {
    try {
      const { id, question, answer } = dto;
      const faq = await this.faqModel.findById(id);
      if (!faq) {
        throw new NotFoundException("Invalid faq Id");
      }
      if (question) faq.question = question.trim();
      if (answer) faq.answer = answer.trim();
      await faq.save();
      return { message: "faq Updated succesfully", data: faq };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async deleteFaq(id) {
    try {
      const faq = await this.faqModel.findByIdAndDelete(id);
      if (!faq) {
        throw new NotFoundException("Invalid faq Id");
      }
      return { message: "faq deleted" };
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
