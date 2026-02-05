import { Model } from "mongoose";
import { WebhookLogDocument, WebhookEvent } from "./schema/webhook-log.schema";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
export declare class WebhookService {
    private readonly webhookLogModel;
    private readonly appsModel;
    private readonly encryptionService;
    private readonly logger;
    private readonly MAX_RETRY_ATTEMPTS;
    private readonly RETRY_DELAYS;
    constructor(webhookLogModel: Model<WebhookLogDocument>, appsModel: Model<AppsDocument>, encryptionService: EncryptionService);
    generateSignature(payload: any, secret: string): string;
    sendWebhook(appId: string, paymentId: string, event: WebhookEvent, paymentData: any): Promise<void>;
    executeWebhook(webhookLogId: string): Promise<void>;
    retryFailedWebhooks(): Promise<void>;
    getWebhookLogs(appId: string, query: any): Promise<any>;
}
