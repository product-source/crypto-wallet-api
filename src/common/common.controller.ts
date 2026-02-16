import { Body, Controller, Post } from "@nestjs/common";
import { getTatumPrice } from "../helpers/helper";

@Controller("common")
export class CommonController {
    @Post("price")
    async getPrice(
        @Body("currency") currency: string, // e.g., 'usd'
        @Body("symbol") symbol: string // e.g., 'BTC' or comma separated 'BTC,ETH'
    ) {
        // If symbol contains comma, handle multiple
        if (symbol.includes(",")) {
            const symbols = symbol.split(",");
            const result = {};

            await Promise.all(symbols.map(async (s) => {
                const cleanSymbol = s.trim().toUpperCase();
                const price = await getTatumPrice(cleanSymbol, currency);
                result[cleanSymbol] = price;
            }));
            return { success: true, data: result };
        } else {
            const cleanSymbol = symbol.trim().toUpperCase();
            const price = await getTatumPrice(cleanSymbol, currency);
            return { success: true, data: { [cleanSymbol]: price } };
        }
    }
}
