import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddPageDto {
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
  heading: string;

  @IsOptional()
  @IsString()
  @MaxLength(1050)
  description: string;

  @IsOptional()
  otherValues: any;

  @IsOptional()
  serviceHeading: any;

  @IsOptional()
  serviceSubHeading: any;
}

export class UpdatePageDto {
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
  heading: string;

  @IsOptional()
  @MaxLength(1050)
  description: string;

  @IsOptional()
  otherValues: any;

  @IsOptional()
  serviceHeading: any;

  @IsOptional()
  serviceSubHeading: any;
}
