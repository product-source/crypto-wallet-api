import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddOtherPageDto {
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
  description: string;
}

export class UpdateOtherPageDto {
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
  description: string;
}
