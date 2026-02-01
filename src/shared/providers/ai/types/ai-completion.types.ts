import { AiModel } from '../enums/ai-model.enum';

export interface AiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AiFunctionDeclaration {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface AiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface AiCompletionConfig {
  model: AiModel;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseSchema?: Record<string, unknown>;
  functionDeclarations?: AiFunctionDeclaration[];
}

export interface AiUsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiCompletionResponse {
  text: string;
  model: string;
  functionCalls?: AiFunctionCall[];
  usage?: AiUsageMetadata;
}
