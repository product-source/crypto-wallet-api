import { Module } from "@nestjs/common";
import { FiatCurrencyService } from "./fiat-currency.service";
import { FiatCurrencyController } from "./fiat-currency.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { FiatCurrency, FiatCurrencySchema } from "./schema/fiat-currency.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FiatCurrency.name, schema: FiatCurrencySchema },
        ]),
    ],
    controllers: [FiatCurrencyController],
    providers: [FiatCurrencyService],
    exports: [FiatCurrencyService],
})
export class FiatCurrencyModule { }
