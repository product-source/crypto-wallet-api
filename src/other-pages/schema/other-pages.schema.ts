import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type OtherPageDocument = OtherPage & Document;

@Schema({ timestamps: true })
export class OtherPage {
  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop()
  title: string;

  @Prop()
  subTitle: string;

  @Prop()
  description: string;
}

export const OtherPageSchema = SchemaFactory.createForClass(OtherPage);
