import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Role, Permission } from "src/auth/enums/role.enum";

export class AdminSignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;
}

export class AdminLoginDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class verifyMailDto {
  @IsNotEmpty()
  @IsEmail()
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

export class ChangePasswordDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class AdminUpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  email: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  contactNumber: string;
}

export class PlatformFeeDto {
  @IsOptional()
  @IsNumber()
  @Min(0, { message: "platformFee must be greater than 0" })
  @Max(50, { message: "platformFee must be less than or equal to 50" })
  platformFee: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "merchantFee must be greater than 0" })
  @Max(50, { message: "merchantFee must be less than or equal to 50" })
  merchantFee: number;

  @IsOptional()
  adminWallet: string;

  // rahul
  @IsOptional()
  @IsNumber()
  @Min(0, { message: "tronPlatformFee must be greater than 0" })
  @Max(50, { message: "tronPlatformFee must be less than or equal to 50" })
  tronPlatformFee: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "tronMerchantFee must be greater than 0" })
  @Max(50, { message: "tronMerchantFee must be less than or equal to 50" })
  tronMerchantFee: number;

  @IsOptional()
  tronAdminWallet: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "btcPlatformFee must be greater than 0" })
  @Max(50, { message: "btcPlatformFee must be less than or equal to 50" })
  btcPlatformFee: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "btcMerchantFee must be greater than 0" })
  @Max(50, { message: "btcMerchantFee must be less than or equal to 50" })
  btcMerchantFee: number;

  @IsOptional()
  btcAdminWallet: string;
}

export class UpdateFiatWalletDto {
  @IsOptional()
  FiatEvmAdminWallet: string;

  @IsOptional()
  FiatTronAdminWallet: string;

  @IsOptional()
  FiatbtcAdminWallet: string;
}

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class UpdateAdminRoleDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class AdminListQueryDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  page: string;

  @IsOptional()
  @IsString()
  limit: string;
}
