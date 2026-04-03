import { Model } from "mongoose";
import { PaymentLinkDocument } from "src/payment-link/schema/payment-link.schema";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { WebhookService } from "src/webhook/webhook.service";
import { EncryptionService } from "src/utils/encryption.service";
export declare class TatumWebhookService {
    private readonly paymentLinkModel;
    private readonly appsModel;
    private readonly webhookService;
    private readonly encryptionService;
    private readonly logger;
    constructor(paymentLinkModel: Model<PaymentLinkDocument>, appsModel: Model<AppsDocument>, webhookService: WebhookService, encryptionService: EncryptionService);
    verifyHmacSignature(body: any, signature: string): boolean;
    handleTronWebhook(body: any): Promise<{
        status: string;
    }>;
}
