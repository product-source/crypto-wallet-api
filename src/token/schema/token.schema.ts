import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type TokenDocument = Token & Document;

// Determine collection name based on NETWORK_MODE env variable
// mainnet -> 'tokens' (default), testnet -> 'testTokens'
const networkMode = process.env.NETWORK_MODE || "mainnet";
const tokenCollectionName = networkMode === "testnet" ? "testTokens" : "tokens";

@Schema({ timestamps: true, collection: tokenCollectionName })
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

console.log(`[Token Schema] NETWORK_MODE=${networkMode}, using collection: "${tokenCollectionName}"`);
