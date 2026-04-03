export declare class UpdateWebhookDto {
    appId: string;
    apiKey: string;
    secretKey: string;
    webhookUrl: string;
    webhookSecret?: string;
}
export declare class GetWebhookLogsDto {
    appId: string;
    apiKey: string;
    secretKey: string;
    pageNo?: number;
    limitVal?: number;
    status?: string;
    event?: string;
}
export declare class WebhookPayloadDto {
    event: string;
    paymentId: string;
    orderId?: string;
    amount: string;
    currency: string;
    status: string;
    timestamp: number;
    signature: string;
    data?: {
        hash?: string;
        fromAddress?: string;
        toAddress?: string;
        blockNumber?: string;
        chainId?: string;
        recivedAmount?: string;
    };
}
