# Sistema de Cobranca de Faturas via WhatsApp

## Visao Geral

Sistema de notificacoes automaticas de cobranca via WhatsApp integrado ao modulo de faturas do Neuron. Envia lembretes e cobranças automaticamente com base na data de vencimento das faturas, incluindo valor e chave PIX.

---

## Configuracao

### Variavel de Ambiente

Adicione a chave PIX no `.env`:

```env
PIX_KEY=sua-chave-pix-aqui
```

### Telefone do Usuario

O campo `phone` foi adicionado ao cadastro do usuario. Ele e opcional e deve conter o numero com DDI + DDD (ex: `5521999999999`).

Exemplo de criacao de usuario via API:

```json
POST /users
{
  "name": "Joao Silva",
  "email": "joao@email.com",
  "password": "Senha@123",
  "roleId": "uuid-da-role",
  "phone": "5521999999999"
}
```

Usuarios sem telefone cadastrado serao ignorados nas notificacoes (com log de aviso).

---

## Funcionamento do Cron

O cron roda **todos os dias as 10:00** e verifica todas as faturas nao pagas (`paidAt = null`).

### Regras de Notificacao

| Situacao | Quando | Tipo |
|---|---|---|
| Fatura vence em 2 dias | `dueDate = hoje + 2` | Lembrete |
| Fatura vence hoje | `dueDate = hoje` | Aviso |
| Fatura vencida | `dueDate < hoje` | Cobranca |

- Faturas ja pagas (`paidAt` preenchido) sao ignoradas
- Faturas vencidas recebem cobranca **diariamente** ate serem pagas
- O WhatsApp precisa estar conectado para as mensagens serem enviadas

---

## Templates das Mensagens

### Lembrete (2 dias antes)

```
Ola, *Joao*! 👋

Passando para lembrar que sua fatura vence em *2 dias* (20/04/2026).

📄 *Desenvolvimento do site*
💰 Valor: *R$ 1.500,00*

🔑 Chave PIX: *sua-chave-pix*

Qualquer duvida, estamos a disposicao!
```

### Vence Hoje

```
Ola, *Joao*! ⚠️

Sua fatura vence *hoje* (22/04/2026).

📄 *Desenvolvimento do site*
💰 Valor: *R$ 1.500,00*

🔑 Chave PIX: *sua-chave-pix*

Evite juros, pague hoje mesmo!
```

### Vencida

```
Ola, *Joao*! 🚨

Sua fatura esta *vencida* desde 22/04/2026.

📄 *Desenvolvimento do site*
💰 Valor: *R$ 1.500,00*

🔑 Chave PIX: *sua-chave-pix*

Por favor, regularize o quanto antes. Qualquer duvida, entre em contato!
```

---

## Endpoint Manual

Dispara a notificacao de uma fatura especifica independente do cron.

```
POST /invoices/:id/notify
```

- Requer autenticacao (Bearer token)
- Requer permissao `INVOICES:UPDATE`
- Detecta automaticamente o tipo de mensagem (lembrete, vence hoje ou vencida) com base na data atual
- Retorna `{ "message": "Notificacao enviada com sucesso" }`
- Retorna erro se o WhatsApp nao estiver conectado ou se a fatura ja estiver paga

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/modules/user/entities/user.entity.ts` | Adicionada coluna `phone` (nullable, max 20 chars) |
| `src/modules/user/dto/create-user.dto.ts` | Adicionado campo `phone` opcional no DTO |
| `src/app.module.ts` | Adicionado `ScheduleModule.forRoot()` |
| `src/modules/whatsapp/whatsapp.module.ts` | Exportado `WhatsappClientService` |
| `src/modules/invoice/repository/invoice.repository.ts` | Adicionados metodos `findUnpaidByDueDate()` e `findOverdue()` |
| `src/modules/invoice/invoice-notification.service.ts` | **Novo** — Servico com cron diario e logica de notificacao |
| `src/modules/invoice/invoice.module.ts` | Importado `WhatsappModule`, registrado `InvoiceNotificationService` |
| `src/modules/invoice/invoice.controller.ts` | Adicionado endpoint `POST /:id/notify` |

## Dependencias Adicionadas

| Pacote | Versao | Motivo |
|---|---|---|
| `@nestjs/schedule` | 6.1.1 | Suporte a cron jobs no NestJS |
aa
---

## Logs

O servico gera logs em todas as etapas:

- Inicio e fim da verificacao diaria
- Quantidade de faturas encontradas por tipo
- Envio de cada notificacao (usuario, telefone, fatura)
- Avisos para usuarios sem telefone
- Erros de envio
- Aviso se `PIX_KEY` nao estiver configurada
- Aviso se WhatsApp nao estiver conectado
