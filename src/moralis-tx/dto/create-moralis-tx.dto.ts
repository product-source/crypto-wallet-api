import { IsNotEmpty, IsOptional, IsString } from "class-validator";

// transaction.dto.ts
export class TransactionDto {
  // @IsNotEmpty()
  // appsId: any;

  // @IsOptional()
  // @IsString()
  // note: string;

  // @IsOptional()
  // @IsString()
  // transactionType: string;

  chainId: string;
  streamId: string;
  block: {
    number: string;
    hash: string;
    timestamp: string;
  };
  hash: string | null;
  gas: string | null;
  gasPrice: string | null;
  nonce: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  value: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenDecimals: string | null;
  valueWithDecimals: string | null;
}
