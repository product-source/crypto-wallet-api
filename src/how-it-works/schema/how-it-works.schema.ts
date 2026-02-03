import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type HowItWorksDocument = HowItWorks & Document;

@Schema({ timestamps: true })
export class HowItWorks {
    
  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop()
  title: string;

  @Prop()
  subTitle: string;

  @Prop()
  heading1: string;

  @Prop()
  description1: string;

  @Prop()
  heading2: string;

  @Prop()
  description2: string;

  @Prop()
  heading3: string;

  @Prop()
  description3: string;

  @Prop()
  heading4: string;

  @Prop()
  description4: string;
}

export const HowItWorksSchema = SchemaFactory.createForClass(HowItWorks);
