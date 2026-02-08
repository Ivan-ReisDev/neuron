import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Content } from '@google/genai';
import { AiProvider } from './ai-provider.interface';
import {
  AiMessage,
  AiCompletionConfig,
  AiCompletionResponse,
} from './types/ai-completion.types';
import { AI_MESSAGES } from '../../constants/exception-messages';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });
  }

  async generateContent(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<AiCompletionResponse> {
    try {
      const response = await this.client.models.generateContent({
        model: config.model,
        contents: this.mapMessages(messages),
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          ...(config.functionDeclarations && {
            tools: [
              {
                functionDeclarations: config.functionDeclarations.map((fn) => ({
                  name: fn.name,
                  description: fn.description,
                  parametersJsonSchema: fn.parameters,
                })),
              },
            ],
          }),
        },
      });

      return {
        text: response.text ?? '',
        model: config.model,
        functionCalls: response.functionCalls?.map((fc) => ({
          name: fc.name ?? '',
          args: fc.args ?? {},
        })),
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              completionTokens:
                response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Gemini generateContent error: ${error}`);
      throw new InternalServerErrorException(AI_MESSAGES.GENERATION_FAILED);
    }
  }

  async generateStructuredContent<T>(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<T> {
    try {
      const response = await this.client.models.generateContent({
        model: config.model,
        contents: this.mapMessages(messages),
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema: config.responseSchema,
        },
      });

      return JSON.parse(response.text ?? '{}') as T;
    } catch {
      throw new InternalServerErrorException(AI_MESSAGES.GENERATION_FAILED);
    }
  }

  private mapMessages(messages: AiMessage[]): Content[] {
    return messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
  }
}
