import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddFaqDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsString()
  answer: string;
}

export class UpdateFaqDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  question: string;

  @IsOptional()
  answer: string;
}
