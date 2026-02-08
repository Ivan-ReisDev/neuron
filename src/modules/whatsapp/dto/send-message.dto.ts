import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Numero de telefone no formato 5521999999999',
    example: '5521999999999',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Mensagem a ser enviada',
    example: 'Ola, tudo bem?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
