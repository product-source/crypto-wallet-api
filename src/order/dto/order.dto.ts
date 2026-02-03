import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddOrderDto {
  @IsNotEmpty()
  merchantId: any;

  @IsNotEmpty()
  appsId: any;

  @IsNotEmpty()
  @IsString()
  fiatAmount: string;

  @IsNotEmpty()
  @IsString()
  cryptoAmount: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  remarks: string;
  
}
