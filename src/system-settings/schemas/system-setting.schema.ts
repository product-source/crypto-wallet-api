import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SystemSetting extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  description: string;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
