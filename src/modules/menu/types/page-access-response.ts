import { ApiProperty } from '@nestjs/swagger';

export class PageAccessResponse {
  @ApiProperty({
    description: 'Se o usuário tem acesso à página',
    example: true,
  })
  hasAccess: boolean;
}
