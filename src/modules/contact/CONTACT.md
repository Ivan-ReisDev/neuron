# Contact Module

Módulo responsável pelo gerenciamento de mensagens de contato recebidas pelo
portfólio. Oferece operações completas de CRUD com validação de dados e paginação.
É um módulo direto, sem regras de negócio complexas — todas as operações delegam
diretamente ao repositório base.

## Estrutura do Módulo

```
src/modules/contact/
  entities/
    contact.entity.ts           # Entidade Contact (TypeORM)
  dto/
    create-contact.dto.ts       # DTO de criação
    update-contact.dto.ts       # DTO de atualização parcial
  repositories/
    contact.repository.ts       # Camada de acesso ao banco
  contact.service.ts            # Camada de regras de negócio
  contact.controller.ts         # Camada HTTP / endpoints
  contact.module.ts             # Registro do módulo NestJS
```

## Entidade Contact

Estende `BaseEntity`, que fornece `id` (UUID), `createdAt` e `updatedAt` automaticamente.

| Campo         | Tipo             | Obrigatório | Nullable | Observação                    |
| ------------- | ---------------- | ----------- | -------- | ----------------------------- |
| `name`        | `string`         | Sim         | Não      | Nome de quem envia o contato  |
| `email`       | `string`         | Sim         | Não      | Email de quem envia o contato |
| `phone`       | `string \| null` | Não         | Sim      | Telefone opcional (`varchar`) |
| `description` | `string`         | Sim         | Não      | Corpo da mensagem de contato  |

## Endpoints

Prefixo base: `/api/contacts`

### Listar contatos

```
GET /api/contacts
```

Retorna lista paginada de contatos.

**Query Parameters:**

| Param   | Tipo     | Default     | Descrição                 |
| ------- | -------- | ----------- | ------------------------- |
| `page`  | `number` | `1`         | Página atual              |
| `limit` | `number` | `10`        | Itens por página          |
| `sort`  | `string` | `createdAt` | Campo de ordenação        |
| `order` | `string` | `DESC`      | Direção (`ASC` ou `DESC`) |

**Resposta `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Ivan Reis",
      "email": "ivan@email.com",
      "phone": "+55 11 99999-9999",
      "description": "Gostaria de saber mais sobre seus projetos.",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
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

### Buscar contato por ID

```
GET /api/contacts/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do contato (UUID) |

**Respostas:**

| Status | Descrição               |
| ------ | ----------------------- |
| `200`  | Contato encontrado      |
| `400`  | ID com formato inválido |
| `404`  | Contato não encontrado  |

**Resposta `200`:**

```json
{
  "id": "uuid",
  "name": "Ivan Reis",
  "email": "ivan@email.com",
  "phone": "+55 11 99999-9999",
  "description": "Gostaria de saber mais sobre seus projetos.",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

### Criar contato

```
POST /api/contacts
```

**Body (JSON):**

| Campo         | Tipo     | Obrigatório | Validação               |
| ------------- | -------- | ----------- | ----------------------- |
| `name`        | `string` | Sim         | Não pode ser vazio      |
| `email`       | `string` | Sim         | Formato de email válido |
| `phone`       | `string` | Não         | —                       |
| `description` | `string` | Sim         | Não pode ser vazio      |

**Exemplo de request:**

```json
{
  "name": "Ivan Reis",
  "email": "ivan@email.com",
  "phone": "+55 11 99999-9999",
  "description": "Gostaria de saber mais sobre seus projetos."
}
```

**Respostas:**

| Status | Descrição                  |
| ------ | -------------------------- |
| `201`  | Contato criado com sucesso |
| `400`  | Dados de entrada inválidos |

---

### Atualizar contato (parcial)

```
PATCH /api/contacts/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do contato (UUID) |

**Body (JSON):** Todos os campos são opcionais. Mesmas validações do `POST`.

**Exemplo de request:**

```json
{
  "description": "Mensagem atualizada."
}
```

**Respostas:**

| Status | Descrição                      |
| ------ | ------------------------------ |
| `200`  | Contato atualizado com sucesso |
| `400`  | ID com formato inválido        |
| `404`  | Contato não encontrado         |

---

### Remover contato

```
DELETE /api/contacts/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do contato (UUID) |

**Respostas:**

| Status | Descrição                    |
| ------ | ---------------------------- |
| `204`  | Contato removido com sucesso |
| `400`  | ID com formato inválido      |
| `404`  | Contato não encontrado       |

Sem corpo na resposta.

## Regras de Negócio

Este módulo não possui regras de negócio adicionais. O service delega todas
as operações diretamente ao repositório base (`BaseRepository`), que já fornece:

- **Paginação** via `findAll` com `page`, `limit`, `sort` e `order`.
- **Busca por ID** com `NotFoundException` automática se não encontrado.
- **Criação e atualização** com persistência via TypeORM.
- **Remoção** com verificação de existência antes de deletar.
- **Validação de UUID** em todos os parâmetros `:id` via `ParseUuidPipe`.

## Arquitetura em Camadas

```
Request HTTP
  -> ContactController (validação de UUID, validação de body via DTO)
    -> ContactService (delegação direta)
      -> ContactRepository (acesso ao banco via TypeORM / BaseRepository)
        -> PostgreSQL
      <- Entidade retornada
    <- Entidade retornada
  <- Entidade retornada
Response HTTP
```

## Exportações do Módulo

O `ContactModule` não exporta nenhum provider. Ele é um módulo isolado, utilizado
exclusivamente para expor os endpoints REST de contato.
