import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiProviderModule } from './shared/providers/ai/ai-provider.module';
import { SeederModule } from './shared/seeders/seeder.module';
import { ContactModule } from './modules/contact/contact.module';
import { UserModule } from './modules/user/user.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { MenuModule } from './modules/menu/menu.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { BlogModule } from './modules/blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: !isProduction,
          ssl:
            isProduction || configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    AiProviderModule,
    SeederModule,
    PermissionModule,
    RoleModule,
    ContactModule,
    UserModule,
    AuthModule,
    TicketModule,
    MenuModule,
    WhatsappModule,
    BlogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
