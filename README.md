<p align="center">
  <h1 align="center">Neuron</h1>
  <p align="center">API RESTful para portfólio pessoal</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Sobre o Projeto

**Neuron** é uma API RESTful desenvolvida para servir como backend do meu portfólio pessoal. Construída com **NestJS v11** e arquitetura de **monólito modular**, a aplicação segue rigorosamente os princípios de **Clean Code**, **SOLID** e **orientação a objetos forte**.

Principais características:

- API RESTful com padrões corretos de verbos HTTP e status codes
- Banco de dados PostgreSQL com TypeORM
- Documentação automática via Swagger/OpenAPI
- Validação global de dados com class-validator e class-transformer
- Testes end-to-end com Jest e Supertest
- CORS habilitado para todas as origens
- Ambiente de desenvolvimento containerizado com Docker
- Sistema de fixtures para popular o banco automaticamente

## Tecnologias

| Tecnologia            | Descrição                              |
| --------------------- | -------------------------------------- |
| **NestJS v11**        | Framework principal                    |
| **TypeScript 5.7**    | Linguagem com tipagem estática         |
| **TypeORM**           | ORM para mapeamento do banco de dados  |
| **PostgreSQL**        | Banco de dados relacional              |
| **Swagger/OpenAPI**   | Documentação interativa da API         |
| **class-validator**   | Validação de DTOs via decorators       |
| **class-transformer** | Transformação e serialização de dados  |
| **Axios**             | Cliente HTTP para requisições externas |
| **Jest v30**          | Framework de testes                    |
| **Supertest**         | Asserções HTTP para testes E2E         |
| **Prettier**          | Formatação de código                   |
| **ESLint v9**         | Análise estática de código             |
| **Docker**            | Containerização do ambiente            |

## Arquitetura

O projeto utiliza a arquitetura de **monólito modular**, organizada da seguinte forma:

```
src/
  main.ts                          # Bootstrap, configuração global (CORS, pipes, Swagger)
  app.module.ts                    # Módulo raiz - importa todos os módulos de funcionalidade
  shared/                          # Tudo que é compartilhado entre os módulos
    dto/                           # DTOs compartilhados (paginação, filtros, respostas)
    entities/                      # Entidades base/compartilhadas
    interceptors/                  # Interceptors globais
    filters/                       # Filtros de exceção globais
    pipes/                         # Pipes globais
    guards/                        # Guards globais
    utils/                         # Funções utilitárias
    constants/                     # Constantes da aplicação
  modules/                         # Módulos de funcionalidade (um por domínio)
    project/
      project.module.ts
      project.controller.ts
      project.service.ts
      dto/
      entities/
test/
  project.e2e-spec.ts              # Testes E2E (um por módulo)
  jest-e2e.json                    # Configuração do Jest para E2E
```

## Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (recomendado)
- [Node.js](https://nodejs.org/) v22 ou superior (apenas se rodar sem Docker)
- [pnpm](https://pnpm.io/) como gerenciador de pacotes (apenas se rodar sem Docker)

## Executando com Docker (Recomendado)

A forma mais simples de rodar o projeto. Um único comando sobe o PostgreSQL e a aplicação com hot reload:

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd neuron

# Subir o ambiente de desenvolvimento
docker compose up
```

O que acontece automaticamente:

1. O container do **PostgreSQL 17** é iniciado
2. A aplicação **NestJS** é iniciada com hot reload
3. As **tabelas** são criadas a partir das entities (via TypeORM synchronize)
4. As **fixtures** populam o banco com dados de desenvolvimento (se estiver vazio)
5. A **API** fica disponível em `http://localhost:3000`
6. O **Swagger** fica disponível em `http://localhost:3000/api/docs`

Para parar o ambiente:

```bash
# Parar os containers (mantém os dados do banco)
docker compose down

# Parar e remover os dados do banco (reseta tudo)
docker compose down -v
```

As variáveis de ambiente de desenvolvimento estão no arquivo `.env.development`, que já vem configurado no repositório.

## Executando sem Docker

Caso prefira rodar sem Docker, é necessário ter o PostgreSQL instalado localmente.

```bash
# Instalar as dependências
pnpm install

# Copiar o arquivo de variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com os dados do seu banco de dados local e execute:

```bash
# Modo de desenvolvimento (com hot reload)
pnpm start:dev

# Modo de debug
pnpm start:debug

# Modo de produção
pnpm build && pnpm start:prod
```

## Variáveis de Ambiente

| Variável      | Descrição                       | Exemplo       |
| ------------- | ------------------------------- | ------------- |
| `NODE_ENV`    | Ambiente da aplicação           | `development` |
| `PORT`        | Porta em que a API será exposta | `3000`        |
| `DB_HOST`     | Host do banco de dados          | `localhost`   |
| `DB_PORT`     | Porta do banco de dados         | `5432`        |
| `DB_USERNAME` | Usuário do banco de dados       | `postgres`    |
| `DB_PASSWORD` | Senha do banco de dados         | `postgres`    |
| `DB_NAME`     | Nome do banco de dados          | `neuron`      |

A API estará disponível em `http://localhost:3000`.

## Documentação da API

Após iniciar o servidor, a documentação interativa do Swagger estará disponível em:

```
http://localhost:3000/api/docs
```

Todos os endpoints são documentados automaticamente com decorators do Swagger.

## Testes

Este projeto utiliza **apenas testes E2E** (end-to-end). Não utilizamos testes unitários.

```bash
# Executar todos os testes E2E
pnpm test:e2e

# Executar um teste específico
pnpm test:e2e -- --testPathPattern="project"
```

## Scripts Disponíveis

| Script             | Descrição                                 |
| ------------------ | ----------------------------------------- |
| `pnpm build`       | Compila o TypeScript via NestJS CLI       |
| `pnpm start:dev`   | Inicia em modo de desenvolvimento (watch) |
| `pnpm start:debug` | Inicia com debugger acoplado              |
| `pnpm start:prod`  | Inicia a build compilada de produção      |
| `pnpm lint`        | Executa o linter com correção automática  |
| `pnpm format`      | Formata todos os arquivos com Prettier    |
| `pnpm test:e2e`    | Executa todos os testes E2E               |
| `pnpm seed`        | Popula o banco com dados de fixtures      |
| `pnpm db:create`   | Cria o banco de dados                     |
| `pnpm db:drop`     | Apaga o banco de dados                    |

## Padrões do Projeto

- **Clean Code** — funções pequenas, responsabilidade única, nomes significativos
- **OOP forte com SOLID** — aplicado rigorosamente em todas as classes
- **Sem comentários no código** — o código deve ser autodocumentável
- **API RESTful** — verbos HTTP corretos, status codes adequados, recursos no plural
- **Swagger obrigatório** — todos os endpoints documentados com decorators
- **Validação global** — todos os dados de entrada validados via DTOs
- **Apenas testes E2E** — sem testes unitários no projeto

## Autor

**Ivan Reis** - [GitHub](https://github.com/Ivan-ReisDev)

## Licença

Este projeto não possui licença pública definida.
