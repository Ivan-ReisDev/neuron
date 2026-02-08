export const RESOURCE_MESSAGES = {
  NOT_FOUND: (id: string) => `Recurso com id ${id} não foi encontrado`,
  ALREADY_EXISTS: (field: string) => `Este ${field} já está cadastrado`,
  CREATION_FAILED: 'Não foi possível criar o recurso',
  UPDATE_FAILED: 'Não foi possível atualizar o recurso',
  DELETION_FAILED: 'Não foi possível remover o recurso',
};

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `O campo ${field} é obrigatório`,
  INVALID_FORMAT: (field: string) => `O formato do campo ${field} é inválido`,
  INVALID_UUID: 'O identificador fornecido não é um UUID válido',
  MIN_LENGTH: (field: string, min: number) =>
    `O campo ${field} deve ter no mínimo ${min} caracteres`,
  MAX_LENGTH: (field: string, max: number) =>
    `O campo ${field} deve ter no máximo ${max} caracteres`,
};

export const AUTH_MESSAGES = {
  UNAUTHORIZED: 'Credenciais inválidas',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso',
  TOKEN_EXPIRED: 'O token de autenticação expirou',
  TOKEN_INVALID: 'O token de autenticação é inválido',
};

export const AI_MESSAGES = {
  PROVIDER_ERROR: 'Erro ao comunicar com o provedor de IA',
  INVALID_MODEL: (model: string) => `O modelo ${model} não é suportado`,
  INVALID_SCHEMA: 'O schema de resposta fornecido é inválido',
  RATE_LIMIT: 'Limite de requisições ao provedor de IA excedido',
  GENERATION_FAILED: 'Não foi possível gerar a resposta',
};

export const WHATSAPP_MESSAGES = {
  CLIENT_NOT_READY: 'O cliente WhatsApp ainda não está conectado',
  SEND_FAILED: 'Não foi possível enviar a mensagem via WhatsApp',
  CONVERSATION_NOT_FOUND: (id: string) =>
    `Conversa WhatsApp com id ${id} não foi encontrada`,
  NO_ACTIVE_CONVERSATION: (phone: string) =>
    `Nenhuma conversa ativa encontrada para o número ${phone}`,
  CONTACT_WITHOUT_PHONE: 'O contato não possui número de telefone cadastrado',
};
