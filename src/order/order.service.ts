import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Order, OrderDocument } from "./schema/order.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { AddOrderDto } from "./dto/order.dto";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>
  ) {}

  async addOrder(dto: AddOrderDto) {
    try {
      const {
        merchantId,
        appsId,
        fiatAmount,
        cryptoAmount,
        email,
        productId,
        productName,
        remarks,
      } = dto;

      const model = new this.orderModel();
      model.merchantId = merchantId;
      model.appsId = appsId;
      model.fiatAmount = fiatAmount;
      model.cryptoAmount = cryptoAmount;
      model.email = email;
      model.productId = productId;
      model.productName = productName;
      model.remarks = remarks;

      await model.save();
      return { message: "Network added succesfully" };
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
