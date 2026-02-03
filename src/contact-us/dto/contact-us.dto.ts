import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  image: any;

  @IsOptional()
  @IsString()
  pricingId: any;
}

export class UpdateContactDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminReply: string;
}
