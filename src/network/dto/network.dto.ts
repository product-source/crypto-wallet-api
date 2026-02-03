import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddNetworkDto {
  @IsNotEmpty()
  @IsString()
  networkName: string;

  @IsNotEmpty()
  @IsString()
  rpcUrl: string;

  @IsNotEmpty()
  chainId: number;

  @IsNotEmpty()
  @IsString()
  currencySymbol: string;

  @IsNotEmpty()
  @IsString()
  blockExplorerUrl: string;

  @IsOptional()
  @IsString()
  address: string;
}
