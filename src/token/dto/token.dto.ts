import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ChainIdEnum, NetworkEnum } from "../schema/token.enum";

export class AddTokenDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsEnum(ChainIdEnum)
  chainId: ChainIdEnum;

  @IsNotEmpty()
  @IsEnum(NetworkEnum)
  network: NetworkEnum;

  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  minWithdraw: number;

  @IsOptional()
  decimal: number;

  @IsOptional()
  minDeposit: number;
}

export class UpdateMinWithdrawDto {
  @IsNotEmpty()
  @IsString()
  tokenId: string;

  @IsNotEmpty()
  @IsEnum(NetworkEnum)
  network: NetworkEnum;

  @IsOptional()
  @IsEnum(ChainIdEnum)
  chainId: ChainIdEnum;

  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  decimal: number;

  @IsNotEmpty()
  minWithdraw: number;

  @IsNotEmpty()
  minDeposit: number;
}

