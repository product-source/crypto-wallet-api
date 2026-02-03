import { Body, Controller, Post } from "@nestjs/common";
import { OrderService } from "./order.service";
import { AddOrderDto } from "./dto/order.dto";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("add")
  addOrder(@Body() dto: AddOrderDto) {
    return this.orderService.addOrder(dto);
  }
}
