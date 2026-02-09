import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiProvider } from './ai-provider.interface';
import {
  AiMessage,
  AiCompletionConfig,
  AiCompletionResponse,
} from './types/ai-completion.types';
import { AI_MESSAGES } from '../../constants/exception-messages';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

@Injectable()
export class GroqProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';
  }

  async generateContent(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<AiCompletionResponse> {
    try {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: this.buildMessages(messages, config.systemInstruction),
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
      };

      if (config.functionDeclarations?.length) {
        body.tools = config.functionDeclarations.map((fn) => ({
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
          },
        }));
        body.tool_choice = 'auto';
      }

      const { data } = await axios.post(GROQ_API_URL, body, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const choice = data.choices?.[0];
      const message = choice?.message;

      return {
        text: message?.content ?? '',
        model: config.model,
        functionCalls: message?.tool_calls?.map(
          (tc: { function: { name: string; arguments: string } }) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments),
          }),
        ),
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Groq generateContent error: ${error}`);
      throw new InternalServerErrorException(AI_MESSAGES.GENERATION_FAILED);
    }
  }

  async generateStructuredContent<T>(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<T> {
    try {
      const systemPrompt = [
        config.systemInstruction ?? '',
        'You MUST respond with valid JSON only. No extra text.',
        config.responseSchema
          ? `JSON schema: ${JSON.stringify(config.responseSchema)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const { data } = await axios.post(
        GROQ_API_URL,
        {
          model: config.model,
          messages: this.buildMessages(messages, systemPrompt),
          temperature: config.temperature,
          max_tokens: config.maxOutputTokens,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = data.choices?.[0]?.message?.content ?? '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error(`Groq generateStructuredContent error: ${error}`);
      throw new InternalServerErrorException(AI_MESSAGES.GENERATION_FAILED);
    }
  }

  private buildMessages(
    messages: AiMessage[],
    systemInstruction?: string,
  ): Array<{ role: string; content: string }> {
    const result: Array<{ role: string; content: string }> = [];

    if (systemInstruction) {
      result.push({ role: 'system', content: systemInstruction });
    }

    for (const msg of messages) {
      result.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    return result;
  }
}
