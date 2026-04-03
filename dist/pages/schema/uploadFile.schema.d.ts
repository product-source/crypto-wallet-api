export type UploadFileDocument = UploadFile & Document;
export declare class UploadFile {
    image: string;
}
export declare const UploadFileSchema: import("mongoose").Schema<UploadFile, import("mongoose").Model<UploadFile, any, any, any, import("mongoose").Document<unknown, any, UploadFile, any, {}> & UploadFile & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UploadFile, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<UploadFile>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<UploadFile> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
