import { IsNotEmpty, IsString, IsUrl, IsOptional } from "class-validator";

export class UpdateWebhookDto {
  @IsNotEmpty()
  @IsUrl()
  webhookUrl: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

export class WebhookPayloadDto {
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
