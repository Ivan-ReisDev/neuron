# AI Provider

Provider compartilhado para criação de agentes de IA usando a API Gemini.
Registrado como módulo global — disponível em qualquer service sem necessidade
de importar.

---

## Configuração Inicial

### 1. Variável de Ambiente

Adicione a variável `GEMINI_API_KEY` ao `.env`:

```
GEMINI_API_KEY=sua-chave-aqui
```

A chave pode ser obtida em [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Injeção no Service

O provider é global. Basta injetar com `@Inject(AI_PROVIDER)`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import {
  AiProvider,
  AI_PROVIDER,
} from '../../shared/providers/ai/ai-provider.interface';
import { AiModel } from '../../shared/providers/ai/enums/ai-model.enum';

@Injectable()
export class MeuService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}
}
```

---

## Modelos Disponíveis

| Enum                       | Modelo                   | Quando Usar                    |
| -------------------------- | ------------------------ | ------------------------------ |
| `AiModel.GEMINI_2_5_FLASH` | `gemini-2.5-flash`       | Tarefas rápidas, alto volume   |
| `AiModel.GEMINI_2_5_PRO`   | `gemini-2.5-pro`         | Raciocínio complexo            |
| `AiModel.GEMINI_3_FLASH`   | `gemini-3-flash-preview` | Uso geral (texto + multimodal) |
| `AiModel.GEMINI_3_PRO`     | `gemini-3-pro-preview`   | Código e raciocínio avançado   |

---

## Métodos Disponíveis

### `generateContent(messages, config)`

Geração livre de texto. Também suporta function calling.

### `generateStructuredContent<T>(messages, config)`

Geração com retorno JSON garantido pelo schema. A API Gemini valida o JSON
contra o `responseSchema` — o retorno é parseado e tipado como `T`.

---

## Criando Agentes

Um agente é definido pela combinação de:

- **`systemInstruction`** — a personalidade e as regras do agente
- **`model`** — qual modelo usar (velocidade vs. qualidade)
- **`responseSchema`** — formato estruturado de resposta (opcional)
- **`functionDeclarations`** — ferramentas que o agente pode invocar (opcional)

### Agente 1: Classificador de Sentimentos

Agente simples que recebe texto e retorna uma classificação estruturada.

```typescript
import { Injectable, Inject } from '@nestjs/common';
import {
  AiProvider,
  AI_PROVIDER,
} from '../../shared/providers/ai/ai-provider.interface';
import { AiModel } from '../../shared/providers/ai/enums/ai-model.enum';

interface SentimentResult {
  sentiment: string;
  confidence: number;
  explanation: string;
}

@Injectable()
export class SentimentAgentService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async classify(text: string): Promise<SentimentResult> {
    return this.aiProvider.generateStructuredContent<SentimentResult>(
      [{ role: 'user', content: text }],
      {
        model: AiModel.GEMINI_2_5_FLASH,
        systemInstruction:
          'Você é um agente especializado em análise de sentimentos. ' +
          'Classifique o sentimento do texto recebido. ' +
          'Seja preciso na confiança (0.0 a 1.0).',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            sentiment: {
              type: 'STRING',
              enum: ['positivo', 'neutro', 'negativo'],
            },
            confidence: {
              type: 'NUMBER',
              description: 'Nível de confiança entre 0.0 e 1.0',
            },
            explanation: {
              type: 'STRING',
              description: 'Explicação breve da classificação',
            },
          },
          required: ['sentiment', 'confidence', 'explanation'],
        },
      },
    );
  }
}
```

### Agente 2: Gerador de Conteúdo SEO

Agente que recebe um tópico e retorna conteúdo otimizado para SEO com
estrutura definida.

```typescript
interface SeoContent {
  title: string;
  metaDescription: string;
  keywords: string[];
  headings: string[];
  body: string;
}

@Injectable()
export class SeoAgentService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async generate(topic: string, targetAudience: string): Promise<SeoContent> {
    return this.aiProvider.generateStructuredContent<SeoContent>(
      [
        {
          role: 'user',
          content: `Tópico: ${topic}\nPúblico-alvo: ${targetAudience}`,
        },
      ],
      {
        model: AiModel.GEMINI_2_5_PRO,
        temperature: 0.7,
        systemInstruction:
          'Você é um especialista em SEO e marketing de conteúdo. ' +
          'Gere conteúdo otimizado para mecanismos de busca. ' +
          'O título deve ter no máximo 60 caracteres. ' +
          'A meta description deve ter entre 150 e 160 caracteres. ' +
          'Inclua entre 5 e 10 keywords relevantes. ' +
          'O body deve ter pelo menos 300 palavras.',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Título SEO (max 60 chars)',
            },
            metaDescription: {
              type: 'STRING',
              description: 'Meta description (150-160 chars)',
            },
            keywords: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Keywords relevantes para o tópico',
            },
            headings: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Sugestões de headings H2',
            },
            body: {
              type: 'STRING',
              description: 'Corpo do conteúdo em markdown',
            },
          },
          required: [
            'title',
            'metaDescription',
            'keywords',
            'headings',
            'body',
          ],
        },
      },
    );
  }
}
```

### Agente 3: Assistente com Function Calling

Agente que possui ferramentas (funções) que o modelo pode invocar.
O modelo decide qual função chamar com base no contexto da conversa.
Você executa a função e pode enviar o resultado de volta.

```typescript
import {
  AiCompletionResponse,
  AiFunctionCall,
} from '../../shared/providers/ai/types/ai-completion.types';

@Injectable()
export class AssistantAgentService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly contactRepository: ContactRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async process(userMessage: string): Promise<AiCompletionResponse> {
    const response = await this.aiProvider.generateContent(
      [{ role: 'user', content: userMessage }],
      {
        model: AiModel.GEMINI_2_5_FLASH,
        systemInstruction:
          'Você é um assistente interno do sistema Neuron. ' +
          'Use as ferramentas disponíveis para buscar dados quando necessário. ' +
          'Responda sempre em português.',
        functionDeclarations: [
          {
            name: 'findContactByEmail',
            description: 'Busca um contato pelo email no banco de dados',
            parameters: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: 'Email do contato',
                },
              },
              required: ['email'],
            },
          },
          {
            name: 'listRecentContacts',
            description: 'Lista os contatos mais recentes',
            parameters: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Quantidade de contatos (padrão: 10)',
                },
              },
            },
          },
          {
            name: 'countActiveUsers',
            description: 'Conta o total de usuários ativos no sistema',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        ],
      },
    );

    if (response.functionCalls?.length) {
      await this.executeFunctionCalls(response.functionCalls);
    }

    return response;
  }

  private async executeFunctionCalls(calls: AiFunctionCall[]): Promise<void> {
    for (const call of calls) {
      switch (call.name) {
        case 'findContactByEmail':
          await this.contactRepository.findByEmail(
            call.args['email'] as string,
          );
          break;
        case 'listRecentContacts':
          await this.contactRepository.findAll({
            limit: (call.args['limit'] as number) ?? 10,
          });
          break;
        case 'countActiveUsers':
          // executar contagem
          break;
      }
    }
  }
}
```

### Agente 4: Tradutor Multi-idioma

Agente com temperatura baixa para traduções precisas e retorno estruturado
com múltiplos idiomas.

```typescript
interface TranslationResult {
  original: string;
  translations: {
    language: string;
    text: string;
  }[];
}

@Injectable()
export class TranslatorAgentService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async translate(
    text: string,
    targetLanguages: string[],
  ): Promise<TranslationResult> {
    return this.aiProvider.generateStructuredContent<TranslationResult>(
      [
        {
          role: 'user',
          content: `Traduza para: ${targetLanguages.join(', ')}\n\nTexto: ${text}`,
        },
      ],
      {
        model: AiModel.GEMINI_2_5_FLASH,
        temperature: 0.1,
        systemInstruction:
          'Você é um tradutor profissional. ' +
          'Traduza o texto com precisão, mantendo o tom e contexto original. ' +
          'Não adicione explicações, apenas as traduções.',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            original: {
              type: 'STRING',
              description: 'Texto original recebido',
            },
            translations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  language: {
                    type: 'STRING',
                    description: 'Idioma da tradução (ex: en, es, fr)',
                  },
                  text: {
                    type: 'STRING',
                    description: 'Texto traduzido',
                  },
                },
                required: ['language', 'text'],
              },
            },
          },
          required: ['original', 'translations'],
        },
      },
    );
  }
}
```

### Agente 5: Avaliador de Portfólio

Agente específico do domínio Neuron que avalia projetos do portfólio.

```typescript
interface ProjectEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  marketFit: string;
  suggestedTechnologies: string[];
}

@Injectable()
export class PortfolioAgentService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async evaluateProject(project: {
    title: string;
    description: string;
    technologies: string[];
  }): Promise<ProjectEvaluation> {
    return this.aiProvider.generateStructuredContent<ProjectEvaluation>(
      [
        {
          role: 'user',
          content: `Avalie este projeto:
Título: ${project.title}
Descrição: ${project.description}
Tecnologias: ${project.technologies.join(', ')}`,
        },
      ],
      {
        model: AiModel.GEMINI_2_5_PRO,
        temperature: 0.5,
        systemInstruction:
          'Você é um avaliador técnico sênior de projetos de software. ' +
          'Avalie projetos de portfólio considerando qualidade técnica, ' +
          'relevância de mercado e stack tecnológica. ' +
          'Seja objetivo e construtivo nas avaliações. ' +
          'O score deve ser de 1 a 10.',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            score: {
              type: 'INTEGER',
              description: 'Nota geral de 1 a 10',
            },
            strengths: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Pontos fortes do projeto',
            },
            improvements: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Sugestões de melhoria',
            },
            marketFit: {
              type: 'STRING',
              description: 'Análise de adequação ao mercado',
            },
            suggestedTechnologies: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Tecnologias complementares sugeridas',
            },
          },
          required: [
            'score',
            'strengths',
            'improvements',
            'marketFit',
            'suggestedTechnologies',
          ],
        },
      },
    );
  }
}
```

---

## Referência de Configuração

### AiCompletionConfig

| Campo                  | Tipo                      | Obrigatório | Descrição                                    |
| ---------------------- | ------------------------- | ----------- | -------------------------------------------- |
| `model`                | `AiModel`                 | Sim         | Modelo Gemini a ser usado                    |
| `systemInstruction`    | `string`                  | Nao         | Personalidade e regras do agente             |
| `temperature`          | `number`                  | Nao         | Criatividade (0.0 = preciso, 2.0 = criativo) |
| `maxOutputTokens`      | `number`                  | Nao         | Limite de tokens na resposta                 |
| `responseSchema`       | `Record<string, unknown>` | Nao         | JSON Schema para resposta estruturada        |
| `functionDeclarations` | `AiFunctionDeclaration[]` | Nao         | Ferramentas que o agente pode invocar        |

### AiMessage

| Campo     | Tipo                | Descrição              |
| --------- | ------------------- | ---------------------- |
| `role`    | `'user' \| 'model'` | Quem enviou a mensagem |
| `content` | `string`            | Conteúdo da mensagem   |

### AiCompletionResponse

| Campo           | Tipo               | Descrição                                     |
| --------------- | ------------------ | --------------------------------------------- |
| `text`          | `string`           | Texto gerado pelo modelo                      |
| `model`         | `string`           | Modelo utilizado                              |
| `functionCalls` | `AiFunctionCall[]` | Chamadas de função solicitadas pelo modelo    |
| `usage`         | `AiUsageMetadata`  | Tokens consumidos (prompt, completion, total) |

### Tipos do responseSchema

Os tipos disponíveis para definir o schema de resposta:

| Tipo        | Descrição                    |
| ----------- | ---------------------------- |
| `'STRING'`  | Texto                        |
| `'NUMBER'`  | Número decimal               |
| `'INTEGER'` | Número inteiro               |
| `'BOOLEAN'` | Verdadeiro/falso             |
| `'ARRAY'`   | Lista (requer `items`)       |
| `'OBJECT'`  | Objeto (requer `properties`) |

---

## Dicas para Configurar Agentes

### Temperature

- **0.0 - 0.3**: Respostas factuais e determinísticas (traduções, classificações)
- **0.4 - 0.7**: Equilíbrio entre precisão e criatividade (análises, resumos)
- **0.8 - 1.5**: Respostas criativas (geração de conteúdo, brainstorming)
- **Padrão**: Se omitido, o modelo usa o valor padrão interno

### System Instructions

- Seja específico sobre o papel do agente
- Defina restrições claras (idioma, formato, limites)
- Inclua exemplos do comportamento esperado quando necessário
- Quanto mais detalhada a instrução, mais previsível o resultado

### Response Schema

- Sempre defina `required` com os campos obrigatórios
- Use `enum` para restringir valores possíveis
- Use `description` em cada campo para guiar o modelo
- Objetos aninhados são suportados (OBJECT dentro de OBJECT)
- Arrays podem conter qualquer tipo (ARRAY com items de OBJECT)

---

## Como Adicionar um Novo Provider

Para usar outro provider de IA (OpenAI, Anthropic, etc.):

1. Crie uma classe que implemente `AiProvider`
2. Altere `useClass` no `ai-provider.module.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import {
  AiMessage,
  AiCompletionConfig,
  AiCompletionResponse,
} from './types/ai-completion.types';

@Injectable()
export class OpenAiProvider implements AiProvider {
  async generateContent(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<AiCompletionResponse> {
    // implementação com SDK da OpenAI
  }

  async generateStructuredContent<T>(
    messages: AiMessage[],
    config: AiCompletionConfig,
  ): Promise<T> {
    // implementação com SDK da OpenAI
  }
}
```

No módulo:

```typescript
@Global()
@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: OpenAiProvider,
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
```

Nenhum service que consome `AI_PROVIDER` precisa ser alterado.
