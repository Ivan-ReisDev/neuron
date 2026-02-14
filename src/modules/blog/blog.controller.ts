import { Body, Controller, Post } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { CreateBlogDto } from './dtos/create.blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateBlogDto,
  ) {
    return this.blogService.create(user, payload);
  }
}
