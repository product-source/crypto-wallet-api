import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type FiatCurrencyDocument = FiatCurrency & Document;

@Schema({ timestamps: true, collection: "fiatCurrencies" })
export class FiatCurrency {
    @Prop({ required: true, unique: true })
    code: string;

    @Prop({ required: true })
    name: string;

    @Prop({ default: "" })
    symbol: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const FiatCurrencySchema = SchemaFactory.createForClass(FiatCurrency);
