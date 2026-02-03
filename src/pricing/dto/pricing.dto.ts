import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddPricingPageDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  pricing: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class UpdatePricingPageDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  pricing: string;

  @IsOptional()
  @IsString()
  description: string;
}
