import { Document } from 'mongoose';
export declare class SystemSetting extends Document {
    key: string;
    value: string;
    description: string;
}
export declare const SystemSettingSchema: import("mongoose").Schema<SystemSetting, import("mongoose").Model<SystemSetting, any, any, any, Document<unknown, any, SystemSetting, any, {}> & SystemSetting & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SystemSetting, Document<unknown, {}, import("mongoose").FlatRecord<SystemSetting>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SystemSetting> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
