import { Controller, Get } from "@nestjs/common";
import { FiatCurrencyService } from "./fiat-currency.service";

@Controller("fiat-currency")
export class FiatCurrencyController {
    constructor(private readonly fiatCurrencyService: FiatCurrencyService) { }

    @Get("list")
    getAll() {
        return this.fiatCurrencyService.getAll();
    }
}
