# AGENTS.md - Neuron Portfolio API

## Project Overview

NestJS v11 RESTful portfolio API using a **modular monolith** architecture on Express.
Package manager: **pnpm**. Node.js v22+. TypeScript 5.7 targeting ES2023.
Database: **PostgreSQL** via **TypeORM**. Documentation: **Swagger/OpenAPI**.

## Build / Lint / Test Commands

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm build`       | Compile TypeScript via NestJS CLI |
| `pnpm start:dev`   | Start in watch/dev mode           |
| `pnpm start:debug` | Start with debugger attached      |
| `pnpm start:prod`  | Start compiled production build   |
| `pnpm lint`        | Lint and auto-fix all TS files    |
| `pnpm format`      | Format all TS files with Prettier |
| `pnpm test:e2e`    | Run all E2E tests                 |

### Running a Single E2E Test

```bash
pnpm test:e2e -- --testPathPattern="<pattern>"
# Example: run only project-related E2E tests
pnpm test:e2e -- --testPathPattern="project"
```

> **This project uses E2E tests only.** Do not write unit tests (`.spec.ts`).
> All tests go in the `test/` directory as `*.e2e-spec.ts` files.

## Architecture: Modular Monolith

```
src/
  main.ts                              # Bootstrap, global config (CORS, pipes, Swagger)
  app.module.ts                        # Root module - imports all feature modules
  shared/                              # Everything shared across the application
    dto/                               # Shared DTOs (pagination, filters, responses)
    entities/                          # Base/shared entities
    interceptors/                      # Global interceptors
    filters/                           # Global exception filters
    pipes/                             # Global pipes
    guards/                            # Global guards
    utils/                             # Utility functions
    constants/                         # Application constants
  modules/                             # Feature modules (one directory per domain)
    project/
      project.module.ts
      project.controller.ts
      project.service.ts
      dto/
        create-project.dto.ts
        update-project.dto.ts
      entities/
        project.entity.ts
test/
  project.e2e-spec.ts                  # E2E tests (one per feature module)
  jest-e2e.json                        # Jest E2E configuration
```

- `src/shared/` contains everything reusable across modules.
- `src/modules/` contains one directory per domain feature, each as a self-contained NestJS module.
- The root `AppModule` imports all feature modules from `src/modules/`.

## RESTful API Standards

All endpoints follow strict RESTful conventions:

| Method   | Route            | Action         | Status Code |
| -------- | ---------------- | -------------- | ----------- |
| `GET`    | `/resources`     | List all       | 200         |
| `GET`    | `/resources/:id` | Get one by ID  | 200         |
| `POST`   | `/resources`     | Create new     | 201         |
| `PUT`    | `/resources/:id` | Full update    | 200         |
| `PATCH`  | `/resources/:id` | Partial update | 200         |
| `DELETE` | `/resources/:id` | Remove         | 204         |

- Resource names are **plural nouns** (`/projects`, not `/project` or `/getProjects`).
- No verbs in URLs. HTTP methods express the action.
- Use nested resources for relationships (`/projects/:id/technologies`).
- Use `@HttpCode()` to set correct status codes (especially `201` for POST, `204` for DELETE).
- Use query parameters for filtering, sorting, and pagination (`?page=1&limit=10`).
- Return consistent error response format with `statusCode`, `message`, and `error`.

## Absolute Rules

1. **NEVER write comments in code.** No inline, block, or JSDoc comments. Code must be
   self-documenting through clean naming, small functions, and clear structure.
2. **Strong OOP is mandatory.** Apply SOLID principles rigorously in every class.
3. **Clean Code at all times.** Small functions, single responsibility, meaningful names,
   no dead code, no magic numbers, no code duplication.

## OOP & SOLID Principles

- **Single Responsibility:** One class = one reason to change. Controllers handle HTTP,
  services handle business logic, entities represent domain data.
- **Open/Closed:** Extend behavior through composition and abstraction, not modification.
- **Liskov Substitution:** Subtypes must be substitutable for their base types.
- **Interface Segregation:** Prefer small, focused interfaces over large generic ones.
- **Dependency Inversion:** Depend on abstractions. Inject dependencies via constructor.
- Favor **composition over inheritance**. Use small, focused classes.
- Encapsulate internal state. Expose only what is necessary through public methods.

## Formatting (Prettier)

- **Single quotes** (`'hello'` not `"hello"`)
- **Trailing commas** everywhere (objects, arrays, function params)
- 2-space indentation, 80-character print width, semicolons required

## Imports & TypeScript

- ES module syntax: `import { X } from 'module';`
- Order: external packages first, then internal modules (relative imports)
- Relative imports use `./` prefix, no file extensions
- Module system: `nodenext`. `strictNullChecks: true`. `noImplicitAny: false`.
- Always provide **explicit return types** on public methods.
- Use `private readonly` for constructor-injected dependencies.

## Naming Conventions

| Element        | Convention        | Example                        |
| -------------- | ----------------- | ------------------------------ |
| Files          | kebab-case + type | `project.controller.ts`        |
| Classes        | PascalCase + type | `ProjectController`            |
| DTOs           | PascalCase        | `CreateProjectDto`             |
| Entities       | PascalCase        | `Project`                      |
| Methods        | camelCase         | `findAll()`, `createProject()` |
| Variables      | camelCase         | `projectService`, `moduleRef`  |
| Interfaces     | PascalCase        | `ProjectResponse`              |
| Enums          | PascalCase        | `ProjectStatus`                |
| Enum values    | UPPER_SNAKE_CASE  | `ProjectStatus.IN_PROGRESS`    |
| Directories    | kebab-case        | `src/modules/project/dto/`     |
| E2E test files | kebab-case        | `project.e2e-spec.ts`          |

## NestJS Patterns

- **Controllers:** `@Controller('resources')`, inject services via constructor, handle
  HTTP concerns only. Delegate all business logic to the service layer.
- **Services:** `@Injectable()`, contain all business logic and TypeORM repository calls.
- **Modules:** `@Module({})`, declare imports, controllers, providers, exports.
- **DTOs:** Use `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`)
  and `class-transformer` for transformation. Use `@ApiProperty()` from Swagger on every field.
- **Global ValidationPipe** in `main.ts` with `whitelist: true` and `transform: true`.
- **CORS** enabled globally for all origins.
- **Global prefix** `api` set via `app.setGlobalPrefix('api')`.

## TypeORM + PostgreSQL

- Database driver: `pg`. ORM: `typeorm` + `@nestjs/typeorm`.
- Connection configured via `TypeOrmModule.forRootAsync()` in `AppModule`.
- Each feature module registers its entities with `TypeOrmModule.forFeature([Entity])`.
- Entities use decorators: `@Entity()`, `@PrimaryGeneratedColumn('uuid')`, `@Column()`.
- Services inject repositories via `@InjectRepository(Entity)`.
- Use TypeORM repository methods (`find`, `findOne`, `save`, `remove`, `update`).

## Swagger Documentation

- **Every endpoint must be documented with Swagger decorators.**
- Setup in `main.ts` with `SwaggerModule.setup()` and `DocumentBuilder`.
- Controllers: `@ApiTags('feature')` on every controller class.
- Endpoints: `@ApiOperation({ summary: '...' })` and `@ApiResponse({ status, description })`
  on every route handler.
- DTOs: `@ApiProperty({ description, example })` on every property.

## Error Handling

- Use NestJS built-in HTTP exceptions: `NotFoundException`, `BadRequestException`,
  `ConflictException`, `UnauthorizedException`, etc. from `@nestjs/common`.
- Never use raw `throw new Error()` for HTTP responses.
- Validate all inputs via DTOs and the global `ValidationPipe`.

## E2E Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Feature (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/endpoint (GET)', () => {
    return request(app.getHttpServer()).get('/endpoint').expect(200);
  });
});
```

## Key Libraries

| Library                       | Purpose                          |
| ----------------------------- | -------------------------------- |
| `@nestjs/*` (v11)             | Core framework                   |
| `typeorm` + `@nestjs/typeorm` | Database ORM (PostgreSQL)        |
| `pg`                          | PostgreSQL driver                |
| `@nestjs/swagger`             | Swagger/OpenAPI documentation    |
| `class-validator`             | DTO validation decorators        |
| `class-transformer`           | DTO transformation/serialization |
| `axios`                       | External HTTP requests           |
| `supertest`                   | E2E test HTTP assertions         |
| `jest` (v30)                  | Test runner                      |

## What NOT to Do

- Do not write comments in code (no inline, block, or JSDoc)
- Do not write unit tests (`.spec.ts`) - only E2E tests
- Do not use `fetch` or other HTTP clients - use `axios`
- Do not put business logic in controllers
- Do not skip DTO validation or Swagger decorators on any endpoint
- Do not use verbs in URL paths - follow RESTful resource naming
- Do not use `console.log` in production code
- Do not commit `.env` files (they are gitignored)
- Do not create files outside the `src/shared/` and `src/modules/` structure
