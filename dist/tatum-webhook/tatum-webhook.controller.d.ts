import { TatumWebhookService } from "./tatum-webhook.service";
export declare class TatumWebhookController {
    private readonly tatumWebhookService;
    private readonly logger;
    constructor(tatumWebhookService: TatumWebhookService);
    handleTronWebhook(body: any, signatureHeader: string): Promise<{
        status: string;
    } | {
        status: string;
        reason: string;
    }>;
}
