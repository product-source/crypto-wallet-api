import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
}

//admin side
export class AppListDto {
  @IsOptional()
  @IsString()
  merchantId: string;
}

