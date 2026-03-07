import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class CreateAppsDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(["WHITE", "DARK"])
  theme: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: "Tolerance margin cannot be less than 0%" })
  @Max(100, { message: "Tolerance margin cannot be strictly greater than 100%" })
  toleranceMargin: number;
}

export class UpdateAppsDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(["WHITE", "DARK"])
  theme: string;

  @IsOptional()
  @IsString()
  removeLogo: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: "Tolerance margin cannot be less than 0%" })
  @Max(100, { message: "Tolerance margin cannot be strictly greater than 100%" })
  toleranceMargin: number;
}

//admin side
export class AppListDto {
  @IsOptional()
  @IsOptional()
  @IsString()
  merchantId: string;
}

// Wallet Whitelist Feature
export class RequestWhitelistOtpDto {
  @IsNotEmpty()
  @IsString()
  appId: string;
}

export class AddWhitelistDto {
  @IsNotEmpty()
  @IsString()
  appId: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  network: string;

  @IsNotEmpty()
  @IsString()
  otp: string; // The 6-digit OTP
}

export class RemoveWhitelistDto {
  @IsNotEmpty()
  @IsString()
  appId: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  otp: string; // The 6-digit OTP
}
