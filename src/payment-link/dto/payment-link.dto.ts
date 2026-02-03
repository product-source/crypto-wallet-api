import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import {
  CoinId,
  DaysType,
  FiatCurrency,
  TransactionType,
  WithdrawType,
} from "../schema/payment.enum";

export class AddPaymnetLinkDto {
  @IsNotEmpty()
  appId: any;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  secretKey: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  buyerEmail: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  buyerName: string;

  @IsOptional()
  @IsString()
  itemName: string;

  @IsOptional()
  @IsString()
  itemNumber: string;

  @IsOptional()
  @IsString()
  invoice: string;

  @IsOptional()
  @IsString()
  custom: string;

  @IsOptional()
  @IsString()
  ipnUrl: string;

  @IsOptional()
  @IsString()
  successUrl: string;

  @IsOptional()
  @IsString()
  cancelUrl: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsOptional()
  @IsEnum(FiatCurrency)
  fiatCurrency: FiatCurrency;

  // @IsOptional()
  // @IsEnum(CoinId)
  // coinId: CoinId;
}

export class DepositFundDto {
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @IsNotEmpty()
  @IsString()
  tokenBalance: string;
}

export class FundWithdrawDto {
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @IsNotEmpty()
  @IsString()
  chainId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(WithdrawType)
  withdrawType: WithdrawType;
}

export class TableDataDto {
  @IsNotEmpty()
  @IsString()
  // @IsDate()
  startDate: string;

  @IsNotEmpty()
  // @IsDate()
  @IsString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(DaysType)
  timeFormat: DaysType;
}

export class GetPaymentLinkTronBalance {
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}
