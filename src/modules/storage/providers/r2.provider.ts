import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const R2_CLIENT = 'R2_CLIENT';

export const R2Provider: Provider = {
  provide: R2_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${configService.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: configService.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
  },
  inject: [ConfigService],
};
