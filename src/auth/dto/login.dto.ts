import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class MerchantLoginDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  acceptTermsConditions: string;
}

export class MerchantOTPDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  otp: any; // Allow string or number for compatibility
}

export class Verify2FaDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class Disable2FaDto {
  @IsOptional()
  @IsString()
  password?: string;
}
