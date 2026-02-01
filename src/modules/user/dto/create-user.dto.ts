import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'Ivan Reis',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'ivan@email.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres)',
    example: 'Senha@123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'ID da role do usuário',
    example: 'uuid-da-role',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Status do usuário (ativo/inativo)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
