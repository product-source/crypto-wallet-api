import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type UploadFileDocument = UploadFile & Document;

@Schema({ timestamps: true })
export class UploadFile {
  @Prop()
  image: string;
}

export const UploadFileSchema = SchemaFactory.createForClass(UploadFile);
