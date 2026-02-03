import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type TokenDocument = Token & Document;

@Schema({ timestamps: true })
export class Token {
  @Prop({ default: "" })
  address: string;

  @Prop()
  chainId: string;

  @Prop({ default: "" })
  network: string;

  @Prop({ default: "" })
  symbol: string;

  @Prop()
  code: string;

  @Prop({ default: 0 })
  minWithdraw: number;

  @Prop({ default: 0 })
  minDeposit: number;

  @Prop()
  decimal: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
