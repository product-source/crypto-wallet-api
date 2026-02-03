import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Token, TokenDocument } from "./schema/token.schema";
import { Model } from "mongoose";
import { AddTokenDto, UpdateMinWithdrawDto } from "./dto/token.dto";
import { isValidTronAddress } from "src/helpers/tron.helper";
import {
  Notification,
  NotificationDocument,
} from "src/notification/schema/notification.schema";
import { join } from "path";
import * as fs from "fs/promises";

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,

    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>
  ) {}

  async ensureDefaultTokensExist() {
    const tokenCount = await this.tokenModel.countDocuments();

    if (tokenCount === 0) {
      const filePath = join(
        process.cwd(),
        "src/utils/data",
        "coinpera-web.tokens.json"
      );

      // Read the file and parse the JSON
      const fileContent = await fs.readFile(filePath, "utf8");
      const rawTokensData = JSON.parse(fileContent);

      // Remove _id, createdAt, and updatedAt fields
      const tokensData = rawTokensData.map(
        ({ _id, createdAt, updatedAt, ...rest }) => rest
      );

      // Insert the tokens without _id, createdAt, and updatedAt
      await this.tokenModel.insertMany(tokensData);
      console.log(
        "Default tokens inserted successfully......................."
      );
    }
  }

  async addToken(dto: AddTokenDto) {
    try {
      const {
        address,
        chainId,
        network,
        symbol,
        code,
        minWithdraw,
        decimal,
        minDeposit,
      } = dto;

      const tokenExist = await this.tokenModel.findOne({ code: code });
      if (tokenExist) {
        throw new BadRequestException("This token code is already exist");
      }

      const model = await new this.tokenModel();
      model.address = address;
      model.chainId = chainId;
      model.network = network;
      model.symbol = symbol;
      model.code = code;
      model.minWithdraw = minWithdraw;
      model.decimal = decimal;
      model.minDeposit = minDeposit;

      await model.save();

      // saving notification
      const notificationModel = new this.notificationModel({
        notificationType: "ADMIN",
        message: `New Token ${model?.code} added`,
      });
      await notificationModel.save();
      return { message: "Token added succesfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getTokens(query) {
    try {
      const { pageNo, limitVal, search } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 12;

      let queryObject = {};

      if (search) {
        queryObject = {
          $or: [{ network: { $regex: search, $options: "i" } }],
        };
      }

      const token = await this.tokenModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.tokenModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        message: "token info",
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: token,
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

  async tokenById(query) {
    try {
      const { tokenId } = query;

      const token = await this.tokenModel.findById(tokenId);

      if (!token) {
        return new NotFoundException("Invalid token Id");
      }

      return {
        message: "token by Id",
        data: token,
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

  async updateMinWithdraw(dto: UpdateMinWithdrawDto, user) {
    try {
      const {
        tokenId,
        network,
        chainId,
        symbol,
        address,
        code,
        decimal,
        minWithdraw,
        minDeposit,
      } = dto;

      if (!user.isAdmin) {
        return new BadRequestException("Admin privilege required");
      }

      const token = await this.tokenModel.findById({
        _id: tokenId,
      });

      if (!token) {
        return new NotFoundException("Invalid token Id");
      }

      const tokenExist = await this.tokenModel.findOne({ code: code });

      if (tokenExist && tokenExist._id.toString() !== token._id.toString()) {
        throw new BadRequestException("This token code already exists");
      }

      token.network = network;
      token.chainId = chainId;
      token.symbol = symbol;
      token.address = address;
      token.code = code;
      token.decimal = decimal;
      token.minWithdraw = minWithdraw;
      token.minDeposit = minDeposit;
      await token.save();

      // saving notification
      const notificationModel = new this.notificationModel({
        notificationType: "ADMIN",
        message: `${token?.code} Token is updated`,
      });
      await notificationModel.save();

      return {
        message: "Token Updated successfully",
        data: token,
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

  async deleteToken(query) {
    try {
      const { id } = query;
      const token = await this.tokenModel.findById(id);
      if (!token) {
        throw new NotFoundException("Invalid Token Id");
      }

      // Save the notification
      const notificationModel = new this.notificationModel({
        notificationType: "ADMIN",
        message: `${token?.code} Token is deleted`,
      });
      await notificationModel.save();

      // Delete the token
      await this.tokenModel.findByIdAndDelete(id);
      return { message: "Token deleted succesfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getValidateTronAddress(query) {
    try {
      const { address } = query;
      const isValid = isValidTronAddress(address);
      return {
        isValid,
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
}
