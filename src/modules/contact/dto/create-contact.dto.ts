import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ description: 'Nome do contato', example: 'Ivan Reis' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do contato',
    example: 'ivan@email.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do contato',
    example: '+55 11 99999-9999',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Descrição da mensagem de contato',
    example: 'Gostaria de saber mais sobre seus projetos.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
