# Sistema de Permissões - Neuron API

## Visão Geral

O Neuron utiliza um sistema de permissões baseado em **RBAC (Role-Based Access Control)** com três níveis:

```
User → Role → Permissions
```

- **Permission** = combinação de `resource` + `action` (ex: `contacts:read`)
- **Role** = grupo de permissões (ex: ADMIN tem todas, USER tem apenas algumas)
- **User** = possui uma role que define o que ele pode acessar

Ao fazer login, o JWT retornado contém todas as permissões do usuário. O front-end usa essas permissões para controlar a exibição de elementos na interface, e a API valida cada requisição protegida no servidor.

---

## Estrutura do JWT

Ao fazer login via `POST /api/auth/login`, a API retorna um `accessToken` (JWT). O payload do token contém:

```json
{
  "sub": "uuid-do-usuario",
  "email": "admin@neuron.dev",
  "role": "ADMIN",
  "permissions": [
    "contacts:create",
    "contacts:read",
    "contacts:update",
    "contacts:delete",
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "roles:create",
    "roles:read",
    "roles:update",
    "roles:delete",
    "permissions:create",
    "permissions:read",
    "permissions:update",
    "permissions:delete"
  ],
  "iat": 1738368000,
  "exp": 1738371600
}
```

O formato de cada permissão é sempre `resource:action`.

---

## Tipos de Endpoints

### Endpoints Públicos

Não exigem token. Qualquer pessoa pode acessar.

Identificados pelo decorator `@Public()` no código da API.

```
POST /api/auth/login
GET  /api/contacts
GET  /api/contacts/:id
POST /api/contacts
```

### Endpoints Protegidos

Exigem o header `Authorization: Bearer <token>` e uma permissão específica.

Se o token estiver ausente → `401 Unauthorized`
Se o token for válido mas sem a permissão necessária → `403 Forbidden`

---

## Recursos e Ações Disponíveis

### Recursos (`resource`)

| Recurso    | Valor         |
| ---------- | ------------- |
| Contatos   | `contacts`    |
| Usuários   | `users`       |
| Roles      | `roles`       |
| Permissões | `permissions` |

### Ações (`action`)

| Ação      | Valor    |
| --------- | -------- |
| Criar     | `create` |
| Ler       | `read`   |
| Atualizar | `update` |
| Remover   | `delete` |

### Todas as Permissões (16 no total)

| Permissão            | Descrição                     |
| -------------------- | ----------------------------- |
| `contacts:create`    | Permite criar contatos        |
| `contacts:read`      | Permite visualizar contatos   |
| `contacts:update`    | Permite atualizar contatos    |
| `contacts:delete`    | Permite remover contatos      |
| `users:create`       | Permite criar usuários        |
| `users:read`         | Permite visualizar usuários   |
| `users:update`       | Permite atualizar usuários    |
| `users:delete`       | Permite remover usuários      |
| `roles:create`       | Permite criar roles           |
| `roles:read`         | Permite visualizar roles      |
| `roles:update`       | Permite atualizar roles       |
| `roles:delete`       | Permite remover roles         |
| `permissions:create` | Permite criar permissões      |
| `permissions:read`   | Permite visualizar permissões |
| `permissions:update` | Permite atualizar permissões  |
| `permissions:delete` | Permite remover permissões    |

---

## Mapa Completo de Endpoints

### Auth

| Método | Rota              | Público | Permissão | Descrição           |
| ------ | ----------------- | ------- | --------- | ------------------- |
| POST   | `/api/auth/login` | Sim     | -         | Login e obter token |

### Contacts

| Método | Rota                | Público | Permissão         | Descrição             |
| ------ | ------------------- | ------- | ----------------- | --------------------- |
| GET    | `/api/contacts`     | Sim     | -                 | Listar contatos       |
| GET    | `/api/contacts/:id` | Sim     | -                 | Buscar contato por ID |
| POST   | `/api/contacts`     | Sim     | -                 | Criar contato         |
| PATCH  | `/api/contacts/:id` | Nao     | `contacts:update` | Atualizar contato     |
| DELETE | `/api/contacts/:id` | Nao     | `contacts:delete` | Remover contato       |

### Users

| Método | Rota             | Público | Permissão      | Descrição             |
| ------ | ---------------- | ------- | -------------- | --------------------- |
| GET    | `/api/users`     | Nao     | `users:read`   | Listar usuários       |
| GET    | `/api/users/:id` | Nao     | `users:read`   | Buscar usuário por ID |
| POST   | `/api/users`     | Nao     | `users:create` | Criar usuário         |
| PATCH  | `/api/users/:id` | Nao     | `users:update` | Atualizar usuário     |
| DELETE | `/api/users/:id` | Nao     | `users:delete` | Remover usuário       |

### Roles

| Método | Rota             | Público | Permissão      | Descrição          |
| ------ | ---------------- | ------- | -------------- | ------------------ |
| GET    | `/api/roles`     | Nao     | `roles:read`   | Listar roles       |
| GET    | `/api/roles/:id` | Nao     | `roles:read`   | Buscar role por ID |
| POST   | `/api/roles`     | Nao     | `roles:create` | Criar role         |
| PATCH  | `/api/roles/:id` | Nao     | `roles:update` | Atualizar role     |
| DELETE | `/api/roles/:id` | Nao     | `roles:delete` | Remover role       |

### Permissions

| Método | Rota                   | Público | Permissão          | Descrição               |
| ------ | ---------------------- | ------- | ------------------ | ----------------------- |
| GET    | `/api/permissions`     | Nao     | `permissions:read` | Listar permissões       |
| GET    | `/api/permissions/:id` | Nao     | `permissions:read` | Buscar permissão por ID |

---

## Integração com o Front-End

### 1. Login

Envie `email` e `password` para obter o token. Armazene-o no `localStorage` ou em memória.

```typescript
interface AuthResponse {
  accessToken: string;
}

async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Credenciais inválidas');
  }

  const data: AuthResponse = await response.json();

  localStorage.setItem('accessToken', data.accessToken);

  return data;
}
```

### 2. Decodificar o JWT para Extrair Permissões

O payload do JWT é codificado em Base64 na segunda parte do token (entre os dois pontos). Decodifique-o no front-end para extrair as permissões **sem precisar de uma lib externa**.

> **Importante:** essa decodificação no front serve apenas para controle de UI (esconder/mostrar botões). A validação real acontece no servidor.

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

function decodeJwtPayload(token: string): JwtPayload {
  const base64Payload = token.split('.')[1];
  const jsonPayload = atob(base64Payload);
  return JSON.parse(jsonPayload);
}

// Uso:
const token = localStorage.getItem('accessToken')!;
const payload = decodeJwtPayload(token);

console.log(payload.role); // "ADMIN"
console.log(payload.permissions); // ["contacts:create", "contacts:read", ...]
```

### 3. Helper `hasPermission`

Crie uma função utilitária para verificar se o usuário tem uma permissão específica:

```typescript
type Resource = 'contacts' | 'users' | 'roles' | 'permissions';
type Action = 'create' | 'read' | 'update' | 'delete';

function getPermissions(): string[] {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];

  try {
    const payload = decodeJwtPayload(token);
    return payload.permissions;
  } catch {
    return [];
  }
}

function hasPermission(resource: Resource, action: Action): boolean {
  const permissions = getPermissions();
  return permissions.includes(`${resource}:${action}`);
}

// Uso:
hasPermission('contacts', 'delete'); // true ou false
hasPermission('users', 'create'); // true ou false
```

### 4. Hook React `usePermissions`

```tsx
import { useMemo } from 'react';

interface UsePermissionsReturn {
  permissions: string[];
  role: string | null;
  hasPermission: (resource: Resource, action: Action) => boolean;
  isAdmin: boolean;
}

function usePermissions(): UsePermissionsReturn {
  const permissions = useMemo(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { permissions: [], role: null };

    try {
      const payload = decodeJwtPayload(token);
      return {
        permissions: payload.permissions,
        role: payload.role,
      };
    } catch {
      return { permissions: [], role: null };
    }
  }, []);

  const hasPermission = (resource: Resource, action: Action): boolean => {
    return permissions.permissions.includes(`${resource}:${action}`);
  };

  return {
    permissions: permissions.permissions,
    role: permissions.role,
    hasPermission,
    isAdmin: permissions.role === 'ADMIN',
  };
}
```

### 5. Proteger Componentes com Permissão

```tsx
interface ProtectedProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function Protected({
  resource,
  action,
  children,
  fallback = null,
}: ProtectedProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Uso em um componente:
function ContactsPage() {
  return (
    <div>
      <h1>Contatos</h1>
      <ContactList />

      <Protected resource="contacts" action="update">
        <EditContactButton />
      </Protected>

      <Protected resource="contacts" action="delete">
        <DeleteContactButton />
      </Protected>
    </div>
  );
}
```

### 6. Proteger Rotas

```tsx
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
}

function ProtectedRoute({ resource, action, children }: ProtectedRouteProps) {
  const { hasPermission } = usePermissions();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!hasPermission(resource, action)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}

// Uso no router:
<Route
  path="/users"
  element={
    <ProtectedRoute resource="users" action="read">
      <UsersPage />
    </ProtectedRoute>
  }
/>;
```

### 7. Requisições Autenticadas

Todas as requisições para endpoints protegidos precisam do header `Authorization`:

```typescript
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`http://localhost:3000${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new Error('Token expirado');
  }

  if (response.status === 403) {
    throw new Error('Sem permissão para esta ação');
  }

  if (!response.ok) {
    throw new Error('Erro na requisição');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Exemplos de uso:

// Endpoint público (não precisa de token, mas a função envia se existir)
const contacts = await apiRequest('/api/contacts');

// Endpoint protegido (precisa de token + permissão)
const users = await apiRequest('/api/users');

// Criar um usuário (precisa de users:create)
const newUser = await apiRequest('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    name: 'João',
    email: 'joao@email.com',
    password: 'Senha@123',
    roleId: 'uuid-da-role',
  }),
});

// Deletar um contato (precisa de contacts:delete)
await apiRequest('/api/contacts/uuid-do-contato', {
  method: 'DELETE',
});
```

---

## Gerenciamento de Permissões via API

### Listar todas as permissões disponíveis

```
GET /api/permissions
Authorization: Bearer <token>
```

Retorna todas as 16 permissões do sistema com paginação.

### Atribuir permissões a uma role

As permissões são atribuídas **a roles, não a usuários**. Para alterar as permissões de um grupo de usuários, atualize a role deles:

```
PATCH /api/roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionIds": [
    "uuid-contacts-read",
    "uuid-contacts-create",
    "uuid-users-read"
  ]
}
```

### Fluxo completo para adicionar uma permissão a uma role

```bash
# 1. Listar permissões para obter os UUIDs
GET /api/permissions?limit=20

# 2. Listar roles para obter o UUID da role desejada
GET /api/roles

# 3. Atualizar a role com os IDs das permissões desejadas
PATCH /api/roles/<role-id>
{
  "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

> **Atenção:** o campo `permissionIds` no PATCH **substitui** todas as permissões da role. Envie a lista completa de permissões que a role deve ter, incluindo as que ela já possui.

---

## Resumo do Fluxo

```
1. Front faz POST /api/auth/login → recebe { accessToken }
2. Front armazena o token (localStorage / estado)
3. Front decodifica o payload do JWT → extrai permissions[]
4. Front usa hasPermission('resource', 'action') para esconder/mostrar UI
5. Front envia Authorization: Bearer <token> em requests protegidos
6. API valida o token e verifica a permissão no servidor
7. Se 401 → redireciona para login
8. Se 403 → mostra mensagem de "sem permissão"
```
