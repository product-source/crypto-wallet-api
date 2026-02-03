import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  sendToAll: boolean;

  @IsArray()
  @IsOptional()
  merchantIds?: string[];
}