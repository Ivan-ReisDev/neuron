import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './repository/blog.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './repository/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  providers: [BlogService, BlogRepository],
  controllers: [BlogController],
})
export class BlogModule {}
