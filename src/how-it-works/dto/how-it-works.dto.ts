import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddHowItWorksPageDto {
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
  subTitle: string;

  @IsOptional()
  @IsString()
  heading1: string;

  @IsOptional()
  @IsString()
  description1: string;

  @IsOptional()
  @IsString()
  heading2: string;

  @IsOptional()
  @IsString()
  description2: string;

  @IsOptional()
  @IsString()
  heading3: string;

  @IsOptional()
  @IsString()
  description3: string;

  @IsOptional()
  @IsString()
  heading4: string;

  @IsOptional()
  @IsString()
  description4: string;
}

export class UpdateHowItWorksPageDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subTitle: string;

  @IsOptional()
  @IsString()
  heading1: string;

  @IsOptional()
  @IsString()
  description1: string;

  @IsOptional()
  @IsString()
  heading2: string;

  @IsOptional()
  @IsString()
  description2: string;

  @IsOptional()
  @IsString()
  heading3: string;

  @IsOptional()
  @IsString()
  description3: string;


  @IsOptional()
  @IsString()
  heading4: string;

  @IsOptional()
  @IsString()
  description4: string;
}
