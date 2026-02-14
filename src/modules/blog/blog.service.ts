import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from '../auth/types/jwt-payload';
import { BlogRepository } from './repository/blog.repository';
import { CreateBlogDto } from './dtos/create.blog.dto';
import { DeepPartial } from 'typeorm';
import { Blog } from './repository/blog.entity';

@Injectable()
export class BlogService {
  constructor(private readonly repository: BlogRepository) {}

  public async create(user: JwtPayload, payload: CreateBlogDto) {
    const blogData: DeepPartial<Blog> = {
      ...payload,
      userId: user.sub,
      status: 'draft',
    };

    const blog = await this.repository.create(blogData);

    if (!blog) {
      throw new InternalServerErrorException(
        'Erro ao criar blog, tente novamente mais tarde',
      );
    }

    return { message: 'Usuário criado com sucesso' };
  }
}
