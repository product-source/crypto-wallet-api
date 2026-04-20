import { Model } from 'mongoose';
import { SystemSetting } from './schemas/system-setting.schema';
export declare class SystemSettingsService {
    private settingModel;
    constructor(settingModel: Model<SystemSetting>);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, description?: string): Promise<SystemSetting>;
    getAll(): Promise<SystemSetting[]>;
}
