import { IsNotEmpty, IsString, IsUrl, IsOptional, IsNumber } from "class-validator";

export class UpdateWebhookDto {
  @IsNotEmpty()
  @IsString()
  appId: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  secretKey: string;

  @IsNotEmpty()
  @IsUrl()
  webhookUrl: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

export class GetWebhookLogsDto {
  @IsNotEmpty()
  @IsString()
  appId: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  secretKey: string;

  @IsOptional()
  @IsNumber()
  pageNo?: number;

  @IsOptional()
  @IsNumber()
  limitVal?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  event?: string;
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
