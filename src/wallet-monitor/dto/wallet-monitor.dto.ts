import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { WalletType } from "../schema/wallet-monitor.enum";

export class AddWalletMonitorDto {
  @IsOptional()
  appId: any;

  @IsNotEmpty()
  @IsString()
  walletAddress: string;

  @IsOptional()
  expiryTime: number;

  @IsNotEmpty()
  walletType: WalletType;

  @IsNotEmpty()
  isExpiry: boolean;
}
