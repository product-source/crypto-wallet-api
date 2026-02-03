import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class VerifyMailDto {
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  verificationToken: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class UpdateUserProfileDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsBoolean()
  isAccountSuspend: boolean;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  platformName: string;

  @IsOptional()
  @IsString()
  platformCategory: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  contactNumber: string;

  @IsOptional()
  email: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isMFA: boolean;

  @IsOptional()
  @IsBoolean()
  isNotification: boolean;

  @IsOptional()
  @IsBoolean()
  isIPWhitelistEnabled: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whitelistedIPs: string[];
}

export class ChangeUserPasswordDto {
  @IsOptional()
  @IsString()
  currentPassword: string;

  @IsOptional()
  @IsString()
  newPassword: string;

  @IsOptional()
  @IsString()
  confirmPassword: string;
}

export class StatusMerchantDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  isActive: boolean;
}

export class HelloDto {
  @IsNotEmpty()
  @IsString()
  hmac: any;

  @IsNotEmpty()
  @IsString()
  privateKey: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  version: string;

  @IsNotEmpty()
  @IsString()
  cmd: string;

  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  format: string;
}

export class checkPassword {
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  appId: string;

  @IsNotEmpty()
  @IsString()
  chainId: string;
}
