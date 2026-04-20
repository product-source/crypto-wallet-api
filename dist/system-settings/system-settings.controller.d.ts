import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private readonly settingsService;
    constructor(settingsService: SystemSettingsService);
    getPaymentDomain(): Promise<{
        domain: string;
    }>;
    getAll(): Promise<import("./schemas/system-setting.schema").SystemSetting[]>;
    get(key: string): Promise<{
        key: string;
        value: string;
    }>;
    set(key: string, value: string): Promise<import("./schemas/system-setting.schema").SystemSetting>;
}
