import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    constructor(
        @InjectModel(Apps.name)
        private readonly appsModel: Model<AppsDocument>,
        private readonly encryptionService: EncryptionService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const apiKey = request.headers["x-api-key"];
        const secretKey = request.headers["x-secret-key"];

        if (!apiKey || !secretKey) {
            throw new UnauthorizedException(
                "Missing API Key or Secret Key in headers"
            );
        }

        // Find app by looking for matching API_KEY
        const apps = await this.appsModel
            .find()
            .select("+API_KEY +SECRET_KEY")
            .exec();

        let matchedApp: AppsDocument | null = null;

        for (const app of apps) {
            try {
                const decryptedApiKey = this.encryptionService.decryptData(app.API_KEY);
                const decryptedSecretKey = this.encryptionService.decryptData(
                    app.SECRET_KEY
                );

                if (decryptedApiKey === apiKey && decryptedSecretKey === secretKey) {
                    matchedApp = app;
                    break;
                }
            } catch (error) {
                // Skip apps with decryption errors
                continue;
            }
        }

        if (!matchedApp) {
            throw new UnauthorizedException("Invalid API Key or Secret Key");
        }

        // Attach the app and merchant info to the request for use in controllers
        request.app = matchedApp;
        request.appId = matchedApp._id;
        request.merchantId = matchedApp.merchantId;

        return true;
    }
}
