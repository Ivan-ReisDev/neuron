  # Neuron API - Guia de Endpoints para o Front-end

  Base URL: `http://localhost:3000`

  Todas as rotas (exceto login) exigem o header:
  ```
  Authorization: Bearer <token>
  ```

  ---

  ## Autenticacao

  ### Login

  ```
  POST /auth/login
  ```

  **Body (JSON):**
  ```json
  {
    "email": "admin@neuron.dev",
    "password": "Admin@123"
  }
  ```

  **Resposta:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

  > Use o `accessToken` em todas as requisicoes subsequentes no header `Authorization: Bearer <token>`.

  ---

  ## Storage (Upload de Arquivos)

  O bucket R2 e privado. Arquivos nunca sao acessados por URL publica — sempre via URL assinada temporaria.

  ### Upload de arquivo

  ```
  POST /storage/upload
  Content-Type: multipart/form-data
  ```

  | Campo    | Tipo   | Obrigatorio | Descricao                          |
  |----------|--------|-------------|------------------------------------|
  | `file`   | file   | sim         | Arquivo (imagem ou PDF, max 10MB)  |
  | `folder` | string | nao         | Pasta no bucket (ex: "avatars")    |

  > Imagens sao automaticamente comprimidas para WebP.

  **Resposta:**
  ```json
  {
    "id": "uuid-do-arquivo",
    "key": "images/uuid.webp",
    "originalName": "foto.png",
    "mimeType": "image/webp",
    "size": 45230,
    "type": "image",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
  ```

  **curl:**
  ```bash
  curl -X POST http://localhost:3000/storage/upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/caminho/para/imagem.png" \
    -F "folder=avatars"
  ```

  ### Obter URL assinada (para visualizar/baixar)

  ```
  GET /storage/:id/url
  ```

  **Resposta:**
  ```json
  {
    "url": "https://ivan-dev.aae2b920...r2.cloudflarestorage.com/images/uuid.webp?X-Amz-...",
    "expiresIn": 3600
  }
  ```

  > A URL expira em 1 hora (3600s). O front-end deve usar essa URL em `<img src="...">` ou `<a href="...">`.

  **curl:**
  ```bash
  curl http://localhost:3000/storage/abc123-uuid/url \
    -H "Authorization: Bearer <token>"
  ```

  ### Listar arquivos

  ```
  GET /storage?page=1&limit=10&sort=createdAt&order=DESC
  ```

  ### Buscar arquivo por ID

  ```
  GET /storage/:id
  ```

  ### Deletar arquivo

  ```
  DELETE /storage/:id
  ```

  ---

  ## Faturas (Invoices)

  ### Permissoes

  | Acao                          | ADMIN | USER |
  |-------------------------------|-------|------|
  | Criar fatura                  | sim   | nao  |
  | Listar faturas                | todas | suas |
  | Ver fatura por ID             | todas | suas |
  | Atualizar fatura              | sim   | nao  |
  | Deletar fatura                | sim   | nao  |
  | Upload nota fiscal            | sim   | nao  |
  | Upload comprovante            | sim   | nao  |
  | Ver URL da nota fiscal        | sim   | suas |
  | Ver URL do comprovante        | sim   | nao  |

  ### Status da fatura (calculado automaticamente)

  | Status      | Condicao                                |
  |-------------|-----------------------------------------|
  | `pending`   | Data de vencimento no futuro, nao paga  |
  | `overdue`   | Data de vencimento passou, nao paga     |
  | `paid`      | Campo `paidAt` preenchido               |

  > O status NAO e enviado na criacao/edicao. Ele e calculado automaticamente pelo backend com base em `dueDate` e `paidAt`.

  ---

  ### Criar fatura (ADMIN)

  ```
  POST /invoices
  Content-Type: application/json
  ```

  **Body:**
  ```json
  {
    "description": "Mensalidade Marco 2026",
    "amount": 350.00,
    "dueDate": "2026-04-15",
    "userId": "uuid-do-usuario"
  }
  ```

  | Campo         | Tipo   | Obrigatorio | Descricao                              |
  |---------------|--------|-------------|----------------------------------------|
  | `description` | string | sim         | Descricao da fatura                    |
  | `amount`      | number | sim         | Valor (positivo, ex: 150.00)           |
  | `dueDate`     | string | sim         | Data de vencimento (formato ISO)       |
  | `userId`      | string | sim         | UUID do usuario que recebera a fatura  |

  **Resposta:**
  ```json
  {
    "id": "uuid-da-fatura",
    "description": "Mensalidade Marco 2026",
    "amount": 350.00,
    "dueDate": "2026-04-15",
    "paidAt": null,
    "notaFiscalId": null,
    "comprovantes": [],
    "status": "pending",
    "user": { "id": "uuid", "name": "Alice Fernandes", "email": "alice@..." },
    "userId": "uuid-do-usuario",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
  ```

  **curl:**
  ```bash
  curl -X POST http://localhost:3000/invoices \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "description": "Mensalidade Marco 2026",
      "amount": 350.00,
      "dueDate": "2026-04-15",
      "userId": "uuid-do-usuario"
    }'
  ```

  ---

  ### Listar faturas

  ```
  GET /invoices?page=1&limit=10&sort=dueDate&order=ASC
  ```

  | Parametro | Tipo   | Default     | Descricao                    |
  |-----------|--------|-------------|------------------------------|
  | `page`    | number | 1           | Numero da pagina             |
  | `limit`   | number | 10          | Itens por pagina             |
  | `sort`    | string | "createdAt" | Campo para ordenar           |
  | `order`   | string | "DESC"      | Direcao (ASC ou DESC)        |

  **Resposta:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "description": "Mensalidade Marco 2026",
        "amount": "350.00",
        "dueDate": "2026-04-15",
        "paidAt": null,
        "notaFiscalId": null,
        "status": "pending",
        "user": { "id": "...", "name": "Alice", "email": "alice@..." },
        "userId": "uuid-do-usuario",
        "createdAt": "...",
        "updatedAt": "..."
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

  > **Visibilidade:** Quando o usuario e USER, o campo `comprovantes` NAO aparece na resposta. Apenas ADMIN ve esse campo (array de UUIDs dos files). A resposta nunca retorna dados sensiveis (senha, role, permissions) — apenas `user: { id, name, email }`.

  **curl:**
  ```bash
  curl "http://localhost:3000/invoices?page=1&limit=10&sort=dueDate&order=ASC" \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ### Buscar fatura por ID

  ```
  GET /invoices/:id
  ```

  **curl:**
  ```bash
  curl http://localhost:3000/invoices/uuid-da-fatura \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ### Atualizar fatura (ADMIN)

  ```
  PATCH /invoices/:id
  Content-Type: application/json
  ```

  Todos os campos sao opcionais:

  ```json
  {
    "description": "Novo titulo",
    "amount": 400.00,
    "dueDate": "2026-05-01",
    "paidAt": "2026-04-10T14:30:00Z"
  }
  ```

  | Campo         | Tipo   | Descricao                                        |
  |---------------|--------|--------------------------------------------------|
  | `description` | string | Nova descricao                                   |
  | `amount`      | number | Novo valor                                       |
  | `dueDate`     | string | Nova data de vencimento (ISO)                    |
  | `userId`      | string | Reatribuir fatura a outro usuario                |
  | `paidAt`      | string | Data do pagamento (ISO) — marca como paga        |

  > Ao enviar `paidAt`, o status da fatura muda automaticamente para `paid`.

  **curl (marcar como paga):**
  ```bash
  curl -X PATCH http://localhost:3000/invoices/uuid-da-fatura \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "paidAt": "2026-04-10T14:30:00Z" }'
  ```

  ---

  ### Deletar fatura (ADMIN)

  ```
  DELETE /invoices/:id
  ```

  Retorna `204 No Content`. Remove a fatura e seus arquivos associados (nota fiscal e comprovante) do R2.

  **curl:**
  ```bash
  curl -X DELETE http://localhost:3000/invoices/uuid-da-fatura \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ### Upload da Nota Fiscal (ADMIN)

  ```
  POST /invoices/:id/nota-fiscal
  Content-Type: multipart/form-data
  ```

  | Campo  | Tipo | Obrigatorio | Descricao                          |
  |--------|------|-------------|------------------------------------|
  | `file` | file | sim         | Arquivo (imagem ou PDF, max 10MB)  |

  > A nota fiscal pode ser visualizada tanto pelo ADMIN quanto pelo USER dono da fatura. Se ja existir uma nota fiscal, a anterior e substituida.

  **curl:**
  ```bash
  curl -X POST http://localhost:3000/invoices/uuid-da-fatura/nota-fiscal \
    -H "Authorization: Bearer <token>" \
    -F "file=@/caminho/para/nota-fiscal.pdf"
  ```

  ---

  ### Upload de Comprovante (ADMIN)

  Uma fatura pode ter multiplos comprovantes. Cada upload adiciona um novo (nao substitui).

  ```
  POST /invoices/:id/comprovante
  Content-Type: multipart/form-data
  ```

  | Campo  | Tipo | Obrigatorio | Descricao                          |
  |--------|------|-------------|------------------------------------|
  | `file` | file | sim         | Arquivo (imagem ou PDF, max 10MB)  |

  > O comprovante so pode ser visualizado pelo ADMIN. O USER nao tem acesso. Cada chamada adiciona um novo comprovante a fatura.

  **curl:**
  ```bash
  curl -X POST http://localhost:3000/invoices/uuid-da-fatura/comprovante \
    -H "Authorization: Bearer <token>" \
    -F "file=@/caminho/para/comprovante.pdf"
  ```

  ---

  ### Remover um Comprovante (ADMIN)

  ```
  DELETE /invoices/:id/comprovantes/:fileId
  ```

  Remove um comprovante especifico da fatura e deleta o arquivo do R2.

  **curl:**
  ```bash
  curl -X DELETE http://localhost:3000/invoices/uuid-da-fatura/comprovantes/uuid-do-file \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ### Obter URL da Nota Fiscal (ADMIN + USER dono)

  ```
  GET /invoices/:id/nota-fiscal/url
  ```

  **Resposta:**
  ```json
  {
    "url": "https://...r2.cloudflarestorage.com/invoices/notas-fiscais/uuid.pdf?X-Amz-...",
    "expiresIn": 3600
  }
  ```

  > O USER so consegue acessar a nota fiscal de faturas que pertencem a ele. Use a `url` retornada para exibir/baixar o arquivo. A URL expira em 1 hora.

  **curl:**
  ```bash
  curl http://localhost:3000/invoices/uuid-da-fatura/nota-fiscal/url \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ### Obter URL de um Comprovante (ADMIN only)

  ```
  GET /invoices/:id/comprovantes/:fileId/url
  ```

  **Resposta:**
  ```json
  {
    "url": "https://...r2.cloudflarestorage.com/invoices/comprovantes/uuid.pdf?X-Amz-...",
    "expiresIn": 3600
  }
  ```

  > Apenas ADMIN pode acessar. USER recebe `403 Forbidden`. Use o `fileId` do array `comprovantes` retornado na listagem.

  **curl:**
  ```bash
  curl http://localhost:3000/invoices/uuid-da-fatura/comprovantes/uuid-do-file/url \
    -H "Authorization: Bearer <token>"
  ```

  ---

  ## Paginacao (padrao para todos os endpoints de listagem)

  Todos os endpoints `GET` que retornam listas suportam:

  | Parametro | Tipo   | Default     | Descricao              |
  |-----------|--------|-------------|------------------------|
  | `page`    | number | 1           | Pagina atual           |
  | `limit`   | number | 10          | Itens por pagina       |
  | `sort`    | string | "createdAt" | Campo para ordenacao   |
  | `order`   | string | "DESC"      | ASC ou DESC            |

  **Resposta padrao:**
  ```json
  {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 0,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  }
  ```

  ---

  ## Codigos de erro comuns

  | Codigo | Significado                                    |
  |--------|------------------------------------------------|
  | 400    | Dados invalidos (validacao falhou)              |
  | 401    | Token nao fornecido ou invalido                |
  | 403    | Sem permissao para este recurso                |
  | 404    | Recurso nao encontrado                         |
  | 413    | Arquivo excede o tamanho maximo (10MB)          |
  | 422    | Tipo de arquivo nao permitido                  |
  | 500    | Erro interno do servidor                       |

  ---

  ## Fluxo tipico de uso

  ### Admin cria e gerencia faturas:

  1. `POST /auth/login` — obter token
  2. `POST /invoices` — criar fatura para um usuario
  3. `PATCH /invoices/:id` com `{ "paidAt": "..." }` — marcar como paga
  4. `POST /invoices/:id/nota-fiscal` — anexar nota fiscal (opcional)
  5. `POST /invoices/:id/comprovante` — anexar comprovante (opcional, admin only)

  ### Usuario visualiza suas faturas:

  1. `POST /auth/login` — obter token
  2. `GET /invoices` — listar suas faturas (com status automatico)
  3. `GET /invoices/:id` — ver detalhes de uma fatura
  4. `GET /invoices/:id/nota-fiscal/url` — baixar/visualizar nota fiscal
