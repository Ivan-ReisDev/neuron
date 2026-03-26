# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Neuron** is a NestJS v11 RESTful API (modular monolith) serving as the backend for a personal portfolio. Written in TypeScript 5.7, targeting ES2023. Uses PostgreSQL via TypeORM, documented with Swagger/OpenAPI. Deployed on Fly.io (Amsterdam region).

## Commands

| Command | Description |
|---|---|
| `pnpm build` | Compile TypeScript via NestJS CLI |
| `pnpm start:dev` | Dev mode with hot reload |
| `pnpm start:debug` | Dev mode with debugger |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier format all TS files |
| `pnpm test:e2e` | Run all E2E tests |
| `pnpm test:e2e -- --testPathPattern="<pattern>"` | Run specific E2E test |
| `pnpm seed` | Populate database with fixtures |
| `docker compose up` | Start full dev environment (PostgreSQL + app) |

Package manager is **pnpm**. Node.js v22+.

## Architecture: Three-Layer Modular Monolith

Every feature module follows **Controller -> Service -> Repository**:

- **Controller** (`@Controller('resources')`): HTTP concerns only (routes, status codes, Swagger). Delegates everything to service. Never contains business logic.
- **Service** (`@Injectable()`): Business logic only. Injects the module repository (never TypeORM `Repository` or `@InjectRepository` directly).
- **Repository** (`@Injectable()`): Extends `BaseRepository<T>` from `src/shared/repositories/base.repository.ts`. The only layer that touches the database. Injects TypeORM `Repository` via `@InjectRepository()`.

All entities extend `BaseEntity` from `src/shared/entities/base.entity.ts` (provides `id` UUID, `createdAt`, `updatedAt`).

`BaseRepository` provides standard CRUD (`findAll`, `findById`, `create`, `update`, `remove`) with built-in pagination (`PaginatedResponseDto`) and automatic `NotFoundException`. Do not reimplement these.

Global prefix is `api` — all routes are under `/api/*`. Swagger at `/api/docs` (non-production only).

## Feature Modules

Located in `src/modules/`: auth, blog, contact, invoice, menu, permission, role, storage, ticket, user, whatsapp.

Key integrations:
- **WhatsApp** (`whatsapp-web.js` + Puppeteer/Chromium) — requires Chromium in Docker
- **AI Provider** (`src/shared/providers/ai/`) — uses `@google/genai`
- **Storage** — AWS S3 via `@aws-sdk/client-s3`
- **Events** — `@nestjs/event-emitter` for cross-module communication
- **Scheduling** — `@nestjs/schedule` for cron jobs

## Absolute Rules

1. **NEVER write comments in code.** No inline, block, or JSDoc. Code must be self-documenting.
2. **Strong OOP with SOLID** applied rigorously in every class.
3. **Only E2E tests** — no unit tests (`.spec.ts`). All tests go in `test/` as `*.e2e-spec.ts`.
4. **All exception messages in pt-BR**, centralized in `src/shared/constants/exception-messages.ts`. Never hardcode message strings.
5. **Every endpoint must have Swagger decorators** (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` on DTOs).
6. **RESTful conventions** — plural nouns in URLs, no verbs, correct HTTP methods and status codes.

## Error Handling

Use NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) with centralized messages:
- `RESOURCE_MESSAGES`, `VALIDATION_MESSAGES`, `AUTH_MESSAGES`, `AI_MESSAGES`, `STORAGE_MESSAGES`, `WHATSAPP_MESSAGES`

## Naming Conventions

- Files: `kebab-case` + type suffix (`project.controller.ts`, `create-project.dto.ts`)
- Classes: `PascalCase` + type suffix (`ProjectController`, `CreateProjectDto`)
- Methods/variables: `camelCase`
- Enum values: `UPPER_SNAKE_CASE`

## TypeScript & Formatting

- Module system: `nodenext`. `strictNullChecks: true`. `noImplicitAny: false`.
- Single quotes, trailing commas, semicolons, 2-space indentation.
- `private readonly` for constructor-injected dependencies.
- Explicit return types on public methods.

## ESLint

- `@typescript-eslint/no-explicit-any`: off
- `@typescript-eslint/no-floating-promises`: warn
- `@typescript-eslint/no-unsafe-argument`: warn

## Database

- PostgreSQL 17 via TypeORM. `synchronize: true` in dev, `false` in production.
- SSL enabled in production or when `DB_SSL=true`.
- `autoLoadEntities: true` — entities registered per module via `TypeOrmModule.forFeature()`.
- Seeder runs via `src/shared/seeders/seeder.module.ts` (auto-populates on startup if empty).

## Docker

- `docker compose up` starts PostgreSQL 17 + NestJS app with hot reload
- Dev uses `Dockerfile.dev` with Chromium for WhatsApp integration
- Production uses multi-stage `Dockerfile` (build + runtime)
- Env vars for dev in `.env.development`
