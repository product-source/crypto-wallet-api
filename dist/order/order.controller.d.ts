import { OrderService } from "./order.service";
import { AddOrderDto } from "./dto/order.dto";
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    addOrder(dto: AddOrderDto): Promise<{
        message: string;
    }>;
}
