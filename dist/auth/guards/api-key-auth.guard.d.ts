import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Model } from "mongoose";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
export declare class ApiKeyAuthGuard implements CanActivate {
    private readonly appsModel;
    private readonly encryptionService;
    constructor(appsModel: Model<AppsDocument>, encryptionService: EncryptionService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
