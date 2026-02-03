import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddInquiryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  platformName: string;

  @IsNotEmpty()
  @IsString()
  platformCategory: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}

export class CreateInquiryDto {
  @IsNotEmpty()
  @IsString()
  id: string;

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
  @IsString()
  uniqueID: string;
}
