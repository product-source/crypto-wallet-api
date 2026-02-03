import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type NetworkDocument = Network & Document;

@Schema({ timestamps: true })
export class Network {
  @Prop({ required: true })
  networkName: string;

  @Prop({ required: true })
  rpcUrl: string;

  @Prop({ required: true })
  chainId: number;

  @Prop({ required: true })
  currencySymbol: string;

  @Prop({ required: true })
  blockExplorerUrl: string;

  @Prop({ default: "" })
  address: string;
}

export const NetworkSchema = SchemaFactory.createForClass(Network);

