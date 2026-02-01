import {
  AiMessage,
  AiCompletionConfig,
  AiCompletionResponse,
} from './types/ai-completion.types';

export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiProvider {
  generateContent(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<AiCompletionResponse>;

  generateStructuredContent<T>(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<T>;
}
