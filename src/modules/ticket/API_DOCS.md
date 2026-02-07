# Neuron API - Documentacao Completa dos Endpoints

## Informacoes Gerais

| Item         | Valor                            |
| ------------ | -------------------------------- |
| Base URL     | `http://localhost:3000/api`      |
| Swagger UI   | `http://localhost:3000/api/docs` |
| Autenticacao | Bearer Token (JWT)               |
| Content-Type | `application/json`               |
| CORS         | Habilitado para todas as origens |

---

## Como Conectar

### 1. Obter o Token de Acesso

Antes de acessar endpoints protegidos, faca login para obter o token JWT:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neuron.dev",
    "password": "Admin@123"
  }'
```

**Resposta:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Usar o Token nas Requisicoes

Inclua o token no header `Authorization` de todas as requisicoes protegidas:

```bash
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Payload do Token JWT

O token decodificado contem:

```json
{
  "sub": "uuid-do-usuario",
  "email": "admin@neuron.dev",
  "role": "ADMIN",
  "permissions": ["tickets:create", "tickets:read", ...]
}
```

---

## Paginacao (Padrao Global)

Todos os endpoints de listagem (`GET /resources`) aceitam query parameters de paginacao:

| Parametro | Tipo    | Padrao      | Descricao                    |
| --------- | ------- | ----------- | ---------------------------- |
| `page`    | integer | `1`         | Numero da pagina (minimo: 1) |
| `limit`   | integer | `10`        | Itens por pagina (minimo: 1) |
| `sort`    | string  | `createdAt` | Campo para ordenacao         |
| `order`   | string  | `DESC`      | Direcao: `ASC` ou `DESC`     |

**Exemplo:**

```bash
GET /api/tickets?page=2&limit=5&sort=createdAt&order=ASC
```

**Formato da Resposta Paginada:**

```json
{
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 5,
    "totalItems": 23,
    "totalPages": 5,
    "hasPreviousPage": true,
    "hasNextPage": true
  }
}
```

---

## Formato de Erro Padrao

```json
{
  "statusCode": 404,
  "message": "Recurso com id abc-123 nao foi encontrado",
  "error": "Not Found"
}
```

Mensagens de erro sao retornadas em portugues (pt-BR).

---

## Enums de Referencia

### TicketPriority

| Valor    | Descricao                 |
| -------- | ------------------------- |
| `low`    | Baixa prioridade          |
| `medium` | Media prioridade (padrao) |
| `high`   | Alta prioridade           |
| `urgent` | Urgente                   |

### TicketStatus

| Valor         | Descricao       |
| ------------- | --------------- |
| `open`        | Aberto (padrao) |
| `in_progress` | Em andamento    |
| `closed`      | Fechado         |

### Resource (Permissoes)

`contacts`, `users`, `roles`, `permissions`, `tickets`

### Action (Permissoes)

`create`, `read`, `update`, `delete`

---

## Permissoes por Role

### ADMIN

Acesso total a todos os recursos e acoes.

### USER

Acesso restrito apenas a tickets:

| Permissao        | Descricao                           |
| ---------------- | ----------------------------------- |
| `tickets:create` | Criar tickets                       |
| `tickets:read`   | Visualizar tickets (apenas os seus) |

> O USER **nao** possui permissoes de contacts, users, roles ou permissions.
> Endpoints publicos (como GET/POST de contacts) continuam acessiveis sem autenticacao.

---

# Endpoints

---

## Auth

### POST /api/auth/login

Autentica um usuario e retorna o token de acesso JWT.

- **Autenticacao:** Publica (nao requer token)
- **Status Code:** `200`

**Request Body:**

| Campo      | Tipo           | Obrigatorio | Descricao        | Exemplo              |
| ---------- | -------------- | ----------- | ---------------- | -------------------- |
| `email`    | string (email) | Sim         | Email do usuario | `"admin@neuron.dev"` |
| `password` | string         | Sim         | Senha do usuario | `"Admin@123"`        |

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neuron.dev",
    "password": "Admin@123"
  }'
```

**Respostas:**

| Status | Descricao                   |
| ------ | --------------------------- |
| `200`  | Login realizado com sucesso |
| `400`  | Dados de entrada invalidos  |
| `401`  | Credenciais invalidas       |

**Resposta 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Tickets

Todos os endpoints de tickets requerem autenticacao (Bearer Token).

- **ADMIN** ve todos os tickets e pode atualizar/remover qualquer ticket.
- **USER** ve apenas seus proprios tickets e pode criar novos.

### GET /api/tickets

Lista tickets com paginacao. ADMIN ve todos, USER ve apenas os seus.

- **Autenticacao:** Bearer Token
- **Permissao:** `tickets:read`
- **Status Code:** `200`

**Query Parameters:** [Paginacao padrao](#paginacao-padrao-global)

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/tickets?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Lista de tickets retornada      |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Erro ao acessar o painel",
      "description": "Ao clicar no botao de login, a pagina retorna erro 500.",
      "priority": "medium",
      "status": "open",
      "links": ["https://exemplo.com/screenshot.png"],
      "userId": "uuid-do-usuario",
      "user": { ... },
      "createdAt": "2026-02-01T12:00:00.000Z",
      "updatedAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

### GET /api/tickets/:id

Busca um ticket pelo ID. USER so acessa os seus proprios tickets.

- **Autenticacao:** Bearer Token
- **Permissao:** `tickets:read`
- **Status Code:** `200`

**Path Parameters:**

| Parametro | Tipo | Descricao    |
| --------- | ---- | ------------ |
| `id`      | UUID | ID do ticket |

**Exemplo:**

```bash
curl -X GET http://localhost:3000/api/tickets/uuid-do-ticket \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Ticket encontrado               |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Ticket nao encontrado           |

---

### POST /api/tickets

Cria um novo ticket. O ticket e vinculado automaticamente ao usuario autenticado.

- **Autenticacao:** Bearer Token
- **Permissao:** `tickets:create`
- **Status Code:** `201`

**Request Body:**

| Campo         | Tipo           | Obrigatorio | Descricao                        | Exemplo                           |
| ------------- | -------------- | ----------- | -------------------------------- | --------------------------------- |
| `title`       | string         | Sim         | Titulo do ticket (max 200 chars) | `"Erro ao acessar o painel"`      |
| `description` | string         | Sim         | Descricao detalhada              | `"Ao clicar no botao..."`         |
| `priority`    | TicketPriority | Nao         | Prioridade (padrao: `medium`)    | `"high"`                          |
| `links`       | string[]       | Nao         | URLs relacionadas                | `["https://exemplo.com/img.png"]` |

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Erro ao acessar o painel",
    "description": "Ao clicar no botao de login, a pagina retorna erro 500.",
    "priority": "high",
    "links": ["https://exemplo.com/screenshot.png"]
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `201`  | Ticket criado com sucesso       |
| `400`  | Dados de entrada invalidos      |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |

---

### PATCH /api/tickets/:id

Atualiza parcialmente um ticket. Apenas ADMIN pode atualizar.

- **Autenticacao:** Bearer Token
- **Permissao:** `tickets:update`
- **Status Code:** `200`

**Path Parameters:**

| Parametro | Tipo | Descricao    |
| --------- | ---- | ------------ |
| `id`      | UUID | ID do ticket |

**Request Body (todos os campos sao opcionais):**

| Campo         | Tipo           | Descricao              | Exemplo                     |
| ------------- | -------------- | ---------------------- | --------------------------- |
| `title`       | string         | Titulo (max 200 chars) | `"Titulo atualizado"`       |
| `description` | string         | Descricao detalhada    | `"Nova descricao"`          |
| `priority`    | TicketPriority | Prioridade             | `"urgent"`                  |
| `links`       | string[]       | URLs relacionadas      | `["https://novo-link.com"]` |
| `status`      | TicketStatus   | Status do ticket       | `"in_progress"`             |

**Exemplo:**

```bash
curl -X PATCH http://localhost:3000/api/tickets/uuid-do-ticket \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "urgent"
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Ticket atualizado com sucesso   |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Ticket nao encontrado           |

---

### DELETE /api/tickets/:id

Remove um ticket. Apenas ADMIN pode remover.

- **Autenticacao:** Bearer Token
- **Permissao:** `tickets:delete`
- **Status Code:** `204` (sem corpo na resposta)

**Path Parameters:**

| Parametro | Tipo | Descricao    |
| --------- | ---- | ------------ |
| `id`      | UUID | ID do ticket |

**Exemplo:**

```bash
curl -X DELETE http://localhost:3000/api/tickets/uuid-do-ticket \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `204`  | Ticket removido com sucesso     |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Ticket nao encontrado           |

---

## Contacts

Endpoints de leitura e criacao sao publicos (nao requerem autenticacao).
Atualizacao e remocao requerem autenticacao com permissoes de ADMIN.
O USER nao possui nenhuma permissao sobre contacts.

### GET /api/contacts

Lista todos os contatos com paginacao.

- **Autenticacao:** Publica
- **Status Code:** `200`

**Query Parameters:** [Paginacao padrao](#paginacao-padrao-global)

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/contacts?page=1&limit=10"
```

**Respostas:**

| Status | Descricao                   |
| ------ | --------------------------- |
| `200`  | Lista de contatos retornada |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Ivan Reis",
      "email": "ivan@email.com",
      "phone": "+55 11 99999-9999",
      "description": "Gostaria de saber mais sobre seus projetos.",
      "createdAt": "2026-02-01T12:00:00.000Z",
      "updatedAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

### GET /api/contacts/:id

Busca um contato pelo ID.

- **Autenticacao:** Publica
- **Status Code:** `200`

**Exemplo:**

```bash
curl -X GET http://localhost:3000/api/contacts/uuid-do-contato
```

**Respostas:**

| Status | Descricao               |
| ------ | ----------------------- |
| `200`  | Contato encontrado      |
| `400`  | ID com formato invalido |
| `404`  | Contato nao encontrado  |

---

### POST /api/contacts

Cria um novo contato.

- **Autenticacao:** Publica
- **Status Code:** `201`

**Request Body:**

| Campo         | Tipo           | Obrigatorio | Descricao           | Exemplo                       |
| ------------- | -------------- | ----------- | ------------------- | ----------------------------- |
| `name`        | string         | Sim         | Nome do contato     | `"Ivan Reis"`                 |
| `email`       | string (email) | Sim         | Email               | `"ivan@email.com"`            |
| `phone`       | string         | Nao         | Telefone            | `"+55 11 99999-9999"`         |
| `description` | string         | Sim         | Mensagem de contato | `"Gostaria de saber mais..."` |

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ivan Reis",
    "email": "ivan@email.com",
    "phone": "+55 11 99999-9999",
    "description": "Gostaria de saber mais sobre seus projetos."
  }'
```

**Respostas:**

| Status | Descricao                  |
| ------ | -------------------------- |
| `201`  | Contato criado com sucesso |
| `400`  | Dados de entrada invalidos |

---

### PATCH /api/contacts/:id

Atualiza parcialmente um contato.

- **Autenticacao:** Bearer Token
- **Permissao:** `contacts:update`
- **Status Code:** `200`

**Request Body (todos opcionais):**

| Campo         | Tipo           | Descricao       |
| ------------- | -------------- | --------------- |
| `name`        | string         | Nome do contato |
| `email`       | string (email) | Email           |
| `phone`       | string         | Telefone        |
| `description` | string         | Mensagem        |

**Exemplo:**

```bash
curl -X PATCH http://localhost:3000/api/contacts/uuid-do-contato \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ivan Reis Atualizado"
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Contato atualizado com sucesso  |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Contato nao encontrado          |

---

### DELETE /api/contacts/:id

Remove um contato.

- **Autenticacao:** Bearer Token
- **Permissao:** `contacts:delete`
- **Status Code:** `204`

**Exemplo:**

```bash
curl -X DELETE http://localhost:3000/api/contacts/uuid-do-contato \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `204`  | Contato removido com sucesso    |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Contato nao encontrado          |

---

## Users

Todos os endpoints de usuarios requerem autenticacao e permissoes.

### GET /api/users

Lista todos os usuarios com paginacao.

- **Autenticacao:** Bearer Token
- **Permissao:** `users:read`
- **Status Code:** `200`

**Query Parameters:** [Paginacao padrao](#paginacao-padrao-global)

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Lista de usuarios retornada     |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Ivan Reis",
      "email": "ivan@email.com",
      "isActive": true,
      "roleId": "uuid-da-role",
      "role": {
        "id": "uuid-da-role",
        "name": "ADMIN",
        "description": "Administrador do sistema",
        "isActive": true,
        "permissions": [ ... ]
      },
      "createdAt": "2026-02-01T12:00:00.000Z",
      "updatedAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

> O campo `password` nunca e retornado nas respostas (excluido via serializer).

---

### GET /api/users/:id

Busca um usuario pelo ID.

- **Autenticacao:** Bearer Token
- **Permissao:** `users:read`
- **Status Code:** `200`

**Exemplo:**

```bash
curl -X GET http://localhost:3000/api/users/uuid-do-usuario \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Usuario encontrado              |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Usuario nao encontrado          |

---

### POST /api/users

Cria um novo usuario.

- **Autenticacao:** Bearer Token
- **Permissao:** `users:create`
- **Status Code:** `201`

**Request Body:**

| Campo      | Tipo           | Obrigatorio | Descricao                     | Exemplo            |
| ---------- | -------------- | ----------- | ----------------------------- | ------------------ |
| `name`     | string         | Sim         | Nome (3-100 chars)            | `"Ivan Reis"`      |
| `email`    | string (email) | Sim         | Email (unico)                 | `"ivan@email.com"` |
| `password` | string         | Sim         | Senha (min 8 chars)           | `"Senha@123"`      |
| `roleId`   | UUID           | Sim         | ID da role                    | `"uuid-da-role"`   |
| `isActive` | boolean        | Nao         | Status ativo (padrao: `true`) | `true`             |

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ivan Reis",
    "email": "ivan@email.com",
    "password": "Senha@123",
    "roleId": "uuid-da-role"
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `201`  | Usuario criado com sucesso      |
| `400`  | Dados de entrada invalidos      |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `409`  | Email ja cadastrado             |

---

### PATCH /api/users/:id

Atualiza parcialmente um usuario.

- **Autenticacao:** Bearer Token
- **Permissao:** `users:update`
- **Status Code:** `200`

**Request Body (todos opcionais):**

| Campo      | Tipo           | Descricao           |
| ---------- | -------------- | ------------------- |
| `name`     | string         | Nome (3-100 chars)  |
| `email`    | string (email) | Email (unico)       |
| `password` | string         | Senha (min 8 chars) |
| `roleId`   | UUID           | ID da role          |
| `isActive` | boolean        | Status ativo        |

**Exemplo:**

```bash
curl -X PATCH http://localhost:3000/api/users/uuid-do-usuario \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ivan Reis Atualizado"
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Usuario atualizado com sucesso  |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Usuario nao encontrado          |
| `409`  | Email ja cadastrado             |

---

### DELETE /api/users/:id

Remove um usuario.

- **Autenticacao:** Bearer Token
- **Permissao:** `users:delete`
- **Status Code:** `204`

**Exemplo:**

```bash
curl -X DELETE http://localhost:3000/api/users/uuid-do-usuario \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `204`  | Usuario removido com sucesso    |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Usuario nao encontrado          |

---

## Roles

Todos os endpoints de roles requerem autenticacao e permissoes.

### GET /api/roles

Lista todas as roles com paginacao.

- **Autenticacao:** Bearer Token
- **Permissao:** `roles:read`
- **Status Code:** `200`

**Query Parameters:** [Paginacao padrao](#paginacao-padrao-global)

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/roles?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Lista de roles retornada        |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ADMIN",
      "description": "Administrador do sistema",
      "isActive": true,
      "permissions": [
        {
          "id": "uuid",
          "resource": "tickets",
          "action": "read",
          "description": "Ler tickets"
        }
      ],
      "createdAt": "2026-02-01T12:00:00.000Z",
      "updatedAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

### GET /api/roles/:id

Busca uma role pelo ID.

- **Autenticacao:** Bearer Token
- **Permissao:** `roles:read`
- **Status Code:** `200`

**Exemplo:**

```bash
curl -X GET http://localhost:3000/api/roles/uuid-da-role \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Role encontrada                 |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Role nao encontrada             |

---

### POST /api/roles

Cria uma nova role.

- **Autenticacao:** Bearer Token
- **Permissao:** `roles:create`
- **Status Code:** `201`

**Request Body:**

| Campo           | Tipo    | Obrigatorio | Descricao                          | Exemplo                  |
| --------------- | ------- | ----------- | ---------------------------------- | ------------------------ |
| `name`          | string  | Sim         | Nome da role (max 50 chars, unico) | `"EDITOR"`               |
| `description`   | string  | Sim         | Descricao (max 255 chars)          | `"Pode editar conteudo"` |
| `isActive`      | boolean | Nao         | Status ativo (padrao: `true`)      | `true`                   |
| `permissionIds` | UUID[]  | Sim         | IDs das permissoes                 | `["uuid-1", "uuid-2"]`   |

**Exemplo:**

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EDITOR",
    "description": "Pode editar conteudo do portfolio",
    "permissionIds": ["uuid-permissao-1", "uuid-permissao-2"]
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `201`  | Role criada com sucesso         |
| `400`  | Dados de entrada invalidos      |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `409`  | Nome ja cadastrado              |

---

### PATCH /api/roles/:id

Atualiza parcialmente uma role.

- **Autenticacao:** Bearer Token
- **Permissao:** `roles:update`
- **Status Code:** `200`

**Request Body (todos opcionais):**

| Campo           | Tipo    | Descricao                  |
| --------------- | ------- | -------------------------- |
| `name`          | string  | Nome (max 50 chars, unico) |
| `description`   | string  | Descricao (max 255 chars)  |
| `isActive`      | boolean | Status ativo               |
| `permissionIds` | UUID[]  | IDs das permissoes         |

**Exemplo:**

```bash
curl -X PATCH http://localhost:3000/api/roles/uuid-da-role \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Descricao atualizada"
  }'
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Role atualizada com sucesso     |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Role nao encontrada             |
| `409`  | Nome ja cadastrado              |

---

### DELETE /api/roles/:id

Remove uma role.

- **Autenticacao:** Bearer Token
- **Permissao:** `roles:delete`
- **Status Code:** `204`

**Exemplo:**

```bash
curl -X DELETE http://localhost:3000/api/roles/uuid-da-role \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `204`  | Role removida com sucesso       |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Role nao encontrada             |

---

## Permissions

Endpoints somente leitura. As permissoes sao gerenciadas via seed.

### GET /api/permissions

Lista todas as permissoes com paginacao.

- **Autenticacao:** Bearer Token
- **Permissao:** `permissions:read`
- **Status Code:** `200`

**Query Parameters:** [Paginacao padrao](#paginacao-padrao-global)

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/permissions?page=1&limit=50" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Lista de permissoes retornada   |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "resource": "tickets",
      "action": "read",
      "description": "Ler tickets",
      "createdAt": "2026-02-01T12:00:00.000Z",
      "updatedAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

### GET /api/permissions/:id

Busca uma permissao pelo ID.

- **Autenticacao:** Bearer Token
- **Permissao:** `permissions:read`
- **Status Code:** `200`

**Exemplo:**

```bash
curl -X GET http://localhost:3000/api/permissions/uuid-da-permissao \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Respostas:**

| Status | Descricao                       |
| ------ | ------------------------------- |
| `200`  | Permissao encontrada            |
| `400`  | ID com formato invalido         |
| `401`  | Token nao fornecido ou invalido |
| `403`  | Sem permissao para este recurso |
| `404`  | Permissao nao encontrada        |

---

## Resumo de Todos os Endpoints

| Metodo   | Rota                   | Descricao         | Auth    | Permissao          |
| -------- | ---------------------- | ----------------- | ------- | ------------------ |
| `POST`   | `/api/auth/login`      | Login             | Publica | -                  |
| `GET`    | `/api/tickets`         | Listar tickets    | Bearer  | `tickets:read`     |
| `GET`    | `/api/tickets/:id`     | Buscar ticket     | Bearer  | `tickets:read`     |
| `POST`   | `/api/tickets`         | Criar ticket      | Bearer  | `tickets:create`   |
| `PATCH`  | `/api/tickets/:id`     | Atualizar ticket  | Bearer  | `tickets:update`   |
| `DELETE` | `/api/tickets/:id`     | Remover ticket    | Bearer  | `tickets:delete`   |
| `GET`    | `/api/contacts`        | Listar contatos   | Publica | -                  |
| `GET`    | `/api/contacts/:id`    | Buscar contato    | Publica | -                  |
| `POST`   | `/api/contacts`        | Criar contato     | Publica | -                  |
| `PATCH`  | `/api/contacts/:id`    | Atualizar contato | Bearer  | `contacts:update`  |
| `DELETE` | `/api/contacts/:id`    | Remover contato   | Bearer  | `contacts:delete`  |
| `GET`    | `/api/users`           | Listar usuarios   | Bearer  | `users:read`       |
| `GET`    | `/api/users/:id`       | Buscar usuario    | Bearer  | `users:read`       |
| `POST`   | `/api/users`           | Criar usuario     | Bearer  | `users:create`     |
| `PATCH`  | `/api/users/:id`       | Atualizar usuario | Bearer  | `users:update`     |
| `DELETE` | `/api/users/:id`       | Remover usuario   | Bearer  | `users:delete`     |
| `GET`    | `/api/roles`           | Listar roles      | Bearer  | `roles:read`       |
| `GET`    | `/api/roles/:id`       | Buscar role       | Bearer  | `roles:read`       |
| `POST`   | `/api/roles`           | Criar role        | Bearer  | `roles:create`     |
| `PATCH`  | `/api/roles/:id`       | Atualizar role    | Bearer  | `roles:update`     |
| `DELETE` | `/api/roles/:id`       | Remover role      | Bearer  | `roles:delete`     |
| `GET`    | `/api/permissions`     | Listar permissoes | Bearer  | `permissions:read` |
| `GET`    | `/api/permissions/:id` | Buscar permissao  | Bearer  | `permissions:read` |

---

## Modelos de Dados

### Ticket

| Campo         | Tipo            | Descricao                         |
| ------------- | --------------- | --------------------------------- |
| `id`          | UUID            | Identificador unico               |
| `title`       | string (200)    | Titulo do ticket                  |
| `description` | text            | Descricao detalhada               |
| `priority`    | TicketPriority  | `low`, `medium`, `high`, `urgent` |
| `status`      | TicketStatus    | `open`, `in_progress`, `closed`   |
| `links`       | string[] / null | URLs relacionadas                 |
| `userId`      | UUID            | ID do usuario criador             |
| `user`        | User            | Objeto do usuario (eager)         |
| `createdAt`   | DateTime        | Data de criacao                   |
| `updatedAt`   | DateTime        | Data da ultima atualizacao        |

### Contact

| Campo         | Tipo           | Descricao                  |
| ------------- | -------------- | -------------------------- |
| `id`          | UUID           | Identificador unico        |
| `name`        | string         | Nome do contato            |
| `email`       | string (unico) | Email                      |
| `phone`       | string / null  | Telefone                   |
| `description` | string         | Mensagem de contato        |
| `createdAt`   | DateTime       | Data de criacao            |
| `updatedAt`   | DateTime       | Data da ultima atualizacao |

### User

| Campo       | Tipo           | Descricao                       |
| ----------- | -------------- | ------------------------------- |
| `id`        | UUID           | Identificador unico             |
| `name`      | string (100)   | Nome do usuario                 |
| `email`     | string (unico) | Email                           |
| `password`  | string         | Senha (nunca retornada via API) |
| `roleId`    | UUID           | ID da role associada            |
| `role`      | Role           | Objeto da role (eager)          |
| `isActive`  | boolean        | Status ativo/inativo            |
| `createdAt` | DateTime       | Data de criacao                 |
| `updatedAt` | DateTime       | Data da ultima atualizacao      |

### Role

| Campo         | Tipo               | Descricao                     |
| ------------- | ------------------ | ----------------------------- |
| `id`          | UUID               | Identificador unico           |
| `name`        | string (50, unico) | Nome da role                  |
| `description` | string (255)       | Descricao                     |
| `isActive`    | boolean            | Status ativo/inativo          |
| `permissions` | Permission[]       | Permissoes associadas (eager) |
| `createdAt`   | DateTime           | Data de criacao               |
| `updatedAt`   | DateTime           | Data da ultima atualizacao    |

### Permission

| Campo         | Tipo     | Descricao                                              |
| ------------- | -------- | ------------------------------------------------------ |
| `id`          | UUID     | Identificador unico                                    |
| `resource`    | Resource | `contacts`, `users`, `roles`, `permissions`, `tickets` |
| `action`      | Action   | `create`, `read`, `update`, `delete`                   |
| `description` | string   | Descricao da permissao                                 |
| `createdAt`   | DateTime | Data de criacao                                        |
| `updatedAt`   | DateTime | Data da ultima atualizacao                             |
