import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting } from './schemas/system-setting.schema';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectModel(SystemSetting.name) private settingModel: Model<SystemSetting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingModel.findOne({ key });
    return setting?.value ?? null;
  }

  async set(key: string, value: string, description?: string): Promise<SystemSetting> {
    return this.settingModel.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true },
    );
  }

  async getAll(): Promise<SystemSetting[]> {
    return this.settingModel.find();
  }
}
