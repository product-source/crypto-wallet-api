import { OrderDocument } from "./schema/order.schema";
import { Model } from "mongoose";
import { AddOrderDto } from "./dto/order.dto";
export declare class OrderService {
    private readonly orderModel;
    constructor(orderModel: Model<OrderDocument>);
    addOrder(dto: AddOrderDto): Promise<{
        message: string;
    }>;
}
