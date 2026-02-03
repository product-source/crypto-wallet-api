import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { TransactionTypes } from "../schema/enum";

export class AddTransactionDto {
  @IsOptional()
  appsId: any;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  toAddress: string;

  @IsNotEmpty()
  @IsString()
  fromAddress: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsNotEmpty()
  gas: string;

  @IsNotEmpty()
  @IsString()
  gasPrice: string;

  @IsNotEmpty()
  @IsString()
  hash: string;

  @IsNotEmpty()
  @IsString()
  blockNumber: string;

  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  chainId: string;

  @IsOptional()
  @IsString()
  file: string;

  @IsNotEmpty()
  @IsString()
  invoice: string;

  @IsString()
  @IsNotEmpty()
  adminFee: string;

  @IsString()
  @IsNotEmpty()
  adminFeeWallet: string;

  @IsString()
  @IsNotEmpty()
  adminFeeTxHash: string;
}

// export class GetEVMWalletHistory {
//   @IsNotEmpty()
//   @IsString()
//   address: string;

//   @IsNotEmpty()
//   @IsEnum(TransactionTypes)
//   type: TransactionTypes;
// }

export class CryptoTransaction {
  @IsNotEmpty()
  @IsString()
  appsId: string;

  @IsNotEmpty()
  @IsString()
  tokenId: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  withdrawalAddress: string;

  @IsNotEmpty()
  @IsBoolean()
  isWithTax: boolean;

  @IsOptional()
  @IsString()
  swapTokenAddress: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class WithdrawFiat {
  @IsNotEmpty()
  // @IsString()
  appsId: any;

  @IsNotEmpty()
  totalFiatBalance: number;

  @IsNotEmpty()
  minimumWithdrawl: number;

  @IsNotEmpty()
  withdrawlAmount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  cryptoValue: number;

  @IsNotEmpty()
  @IsString()
  walletAddress: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class adminFiatTransferDto {
  @IsString()
  @IsNotEmpty()
  fiatWithdrawId: string;

  @IsString()
  @IsNotEmpty()
  txHash: string;
}
