import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'O título não pode ter mais de 200 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
