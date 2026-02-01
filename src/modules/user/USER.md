# User Module

Módulo responsável pelo gerenciamento de usuários da aplicação. Oferece operações
completas de CRUD com validação de dados, hash de senhas via bcrypt e controle de
unicidade de email.

## Estrutura do Módulo

```
src/modules/user/
  enums/
    user-role.enum.ts        # Enum de papéis (USER, ADMIN)
  entities/
    user.entity.ts           # Entidade User (TypeORM)
  dto/
    create-user.dto.ts       # DTO de criação
    update-user.dto.ts       # DTO de atualização parcial
  repositories/
    user.repository.ts       # Camada de acesso ao banco
  user.service.ts            # Camada de regras de negócio
  user.controller.ts         # Camada HTTP / endpoints
  user.module.ts             # Registro do módulo NestJS
```

## Entidade User

Estende `BaseEntity`, que fornece `id` (UUID), `createdAt` e `updatedAt` automaticamente.

| Campo      | Tipo       | Obrigatório | Único | Default         | Observação                              |
| ---------- | ---------- | ----------- | ----- | --------------- | --------------------------------------- |
| `name`     | `string`   | Sim         | Não   | —               | Máximo 100 caracteres                   |
| `email`    | `string`   | Sim         | Sim   | —               | Constraint unique no banco              |
| `password` | `string`   | Sim         | Não   | —               | Excluído das respostas via `@Exclude()` |
| `role`     | `UserRole` | Não         | Não   | `UserRole.USER` | Enum PostgreSQL (`USER`, `ADMIN`)       |
| `isActive` | `boolean`  | Não         | Não   | `true`          | —                                       |

## Enum UserRole

| Valor   | Descrição             |
| ------- | --------------------- |
| `USER`  | Usuário padrão        |
| `ADMIN` | Usuário administrador |

## Endpoints

Prefixo base: `/api/users`

### Listar usuários

```
GET /api/users
```

Retorna lista paginada de usuários.

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
      "role": "USER",
      "isActive": true,
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

### Buscar usuário por ID

```
GET /api/users/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do usuário (UUID) |

**Respostas:**

| Status | Descrição               |
| ------ | ----------------------- |
| `200`  | Usuário encontrado      |
| `400`  | ID com formato inválido |
| `404`  | Usuário não encontrado  |

**Resposta `200`:**

```json
{
  "id": "uuid",
  "name": "Ivan Reis",
  "email": "ivan@email.com",
  "role": "USER",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

### Criar usuário

```
POST /api/users
```

**Body (JSON):**

| Campo      | Tipo       | Obrigatório | Validação                           |
| ---------- | ---------- | ----------- | ----------------------------------- |
| `name`     | `string`   | Sim         | Mínimo 3, máximo 100 caracteres     |
| `email`    | `string`   | Sim         | Formato de email válido             |
| `password` | `string`   | Sim         | Mínimo 8 caracteres                 |
| `role`     | `UserRole` | Não         | `USER` ou `ADMIN` (default: `USER`) |
| `isActive` | `boolean`  | Não         | Default: `true`                     |

**Exemplo de request:**

```json
{
  "name": "Ivan Reis",
  "email": "ivan@email.com",
  "password": "Senha@123",
  "role": "USER",
  "isActive": true
}
```

**Respostas:**

| Status | Descrição                  |
| ------ | -------------------------- |
| `201`  | Usuário criado com sucesso |
| `400`  | Dados de entrada inválidos |
| `409`  | Email já cadastrado        |

**Comportamento:**

- A senha é hasheada com bcrypt (10 salt rounds) antes de ser persistida.
- O email é validado como único no banco antes da criação.
- O campo `password` nunca é retornado na resposta.

---

### Atualizar usuário (parcial)

```
PATCH /api/users/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do usuário (UUID) |

**Body (JSON):** Todos os campos são opcionais. Mesmas validações do `POST`.

**Exemplo de request:**

```json
{
  "name": "Ivan Reis Atualizado"
}
```

**Respostas:**

| Status | Descrição                      |
| ------ | ------------------------------ |
| `200`  | Usuário atualizado com sucesso |
| `400`  | ID com formato inválido        |
| `404`  | Usuário não encontrado         |
| `409`  | Email já cadastrado            |

**Comportamento:**

- Se o `email` for alterado, a unicidade é revalidada (excluindo o próprio usuário).
- Se a `password` for alterada, é hasheada com bcrypt antes de persistir.

---

### Remover usuário

```
DELETE /api/users/:id
```

**Parâmetros de rota:**

| Param | Tipo   | Descrição            |
| ----- | ------ | -------------------- |
| `id`  | `UUID` | ID do usuário (UUID) |

**Respostas:**

| Status | Descrição                    |
| ------ | ---------------------------- |
| `204`  | Usuário removido com sucesso |
| `400`  | ID com formato inválido      |
| `404`  | Usuário não encontrado       |

Sem corpo na resposta.

## Regras de Negócio

- **Hash de senha:** Toda senha é hasheada com bcrypt (10 salt rounds) na criação e
  na atualização.
- **Unicidade de email:** Verificada na camada de serviço antes de criar ou atualizar.
  Na atualização, o próprio usuário é excluído da verificação para permitir manter
  o mesmo email.
- **Exclusão de senha nas respostas:** O campo `password` usa `@Exclude()` do
  class-transformer, ativado pelo `ClassSerializerInterceptor` no controller. Nenhuma
  resposta da API retorna o hash da senha.
- **Validação de UUID:** Todos os parâmetros `:id` são validados pelo `ParseUuidPipe`
  customizado. UUIDs inválidos retornam `400`.

## Arquitetura em Camadas

```
Request HTTP
  -> UserController (validação de UUID, validação de body via DTO)
    -> UserService (unicidade de email, hash de senha)
      -> UserRepository (acesso ao banco via TypeORM)
        -> PostgreSQL
      <- Entidade retornada
    <- Entidade retornada
  <- ClassSerializerInterceptor remove campo password
Response HTTP
```

## Exportações do Módulo

O `UserModule` exporta o `UserService`, permitindo que outros módulos (como um
futuro módulo de autenticação) importem `UserModule` e injetem `UserService`.
