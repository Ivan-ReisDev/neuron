import { Global, Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';

@Global()
@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
