import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type PageDocument = Page & Document;

@Schema({ timestamps: true })
export class Page {

  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop()
  title: string;

  @Prop()
  subTitle: string;

  @Prop()
  heading: string;
  
  @Prop()
  description: string;

  @Prop()
  otherValues: string[];

  @Prop()
  serviceHeading: string[];

  @Prop()
  serviceSubHeading: string[];
}

export const PageSchema = SchemaFactory.createForClass(Page);
