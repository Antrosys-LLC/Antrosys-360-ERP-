# Antrosys ERP - Project Context

This file serves as a comprehensive overview of the Antrosys ERP monorepo. It is designed to be fed into any LLM to immediately provide the necessary context to understand, navigate, and contribute to the project.

## 1. Project Overview & Architecture
Antrosys ERP is a full-stack, enterprise-grade Enterprise Resource Planning system. It uses a modern monorepo architecture managed by **Turborepo** and **pnpm workspaces**.

The repository is divided into two primary applications and shared packages:
- **`apps/web`**: The Next.js frontend application.
- **`apps/api`**: The Fastify Node.js backend application.
- **`packages/types`**: Shared TypeScript contracts (Roles, Permissions) to ensure end-to-end type safety.

## 2. Technology Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **State Management**: Zustand (Client state), TanStack React Query (Server state)
- **Authentication**: NextAuth.js (Credentials Provider interacting with Fastify API)
- **Forms & Validation**: React Hook Form + Zod

### Backend (`apps/api`)
- **Framework**: Fastify (High-performance web framework)
- **Language**: TypeScript
- **Database ORM**: Prisma Client
- **Database Engine**: PostgreSQL 16
- **Caching & Sessions**: Redis (via `ioredis`)
- **Validation**: Zod
- **Authentication**: JWT (`@fastify/jwt`, `jsonwebtoken`), bcryptjs
- **Security**: `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`

### Infrastructure
- **Package Manager**: pnpm (v9+)
- **Monorepo Tool**: Turborepo
- **Containers**: Docker & Docker Compose (for DB and Redis)

## 3. Directory Structure Breakdown

```text
antrosys_erp/
├── package.json                 # Workspace root (Turborepo scripts)
├── pnpm-workspace.yaml          # Defines workspace paths
├── turbo.json                   # Turborepo task definitions
├── docker-compose.yml           # Local dev infrastructure
├── .env                         # Workspace environment variables
│
├── packages/
│   └── types/                   # Shared types, exported to both API and Web
│       ├── src/roles.ts         # Enum defining the 9 system roles (CEO, HR_HEAD, etc.)
│       └── src/permissions.ts   # Granular permissions and ROLE_PERMISSIONS mapping
│
├── apps/
│   ├── web/
│   │   ├── next.config.mjs      # Next.js configuration
│   │   ├── components.json      # shadcn/ui configuration
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/      # Route group for unauthenticated pages (e.g., /login)
│   │       │   ├── (dashboard)/ # Route group for the main application shell
│   │       │   │   ├── layout.tsx # Renders Sidebar and Topbar
│   │       │   │   └── [modules]/ # Next.js pages for hr, finance, admin, etc.
│   │       │   └── api/auth/[...nextauth]/route.ts # NextAuth integration handler
│   │       ├── components/
│   │       │   ├── ui/          # Raw shadcn/ui components
│   │       │   ├── layout/      # Sidebar, Topbar
│   │       │   └── shared/      # PageHeader, EmptyState
│   │       ├── hooks/           # usePermission, useToast
│   │       ├── stores/          # Zustand stores (auth.store.ts, ui.store.ts)
│   │       ├── lib/             # api-client.ts (Axios), utils.ts
│   │       └── constants/       # nav.ts (Role-filtered navigation structure)
│   │
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma    # DB Schema (User, Employee, AuditLog, etc.)
│       │   └── seed/            # Seeding scripts for initial users and roles
│       └── src/
│           ├── app.ts           # Fastify application factory
│           ├── server.ts        # Entry point
│           ├── config/          # env.ts (Zod validation), database.ts, redis.ts
│           ├── plugins/         # auth.plugin.ts (JWT), rbac.plugin.ts (Permissions)
│           ├── shared/          # audit-logger.ts
│           └── modules/         # Feature modules (auth, admin, hr, finance, etc.)
│               └── [module]/    # Contains .routes.ts, .controller.ts, .service.ts, .schema.ts
```

## 4. Key Architectural Concepts

### Role-Based Access Control (RBAC)
- **Definition**: Roles and Permissions are defined strictly in `packages/types`.
- **Backend Enforcment**: Fastify routes are protected using a custom `@requirePermission` hook pre-handler (found in `rbac.plugin.ts`). This checks the incoming user's JWT payload against the required endpoint permission.
- **Frontend Enforcment**: 
  - `middleware.ts` protects the `/(dashboard)` route group.
  - The `nav.ts` constant filters the sidebar based on the user's role/permissions.
  - The custom `usePermission` hook allows conditional rendering of UI elements.

### API Response Standard
The backend generally adheres to returning standardized JSON payloads. Example for success:
```json
{
  "status": "success",
  "data": { ... }
}
```

### Module Stubbing
Currently, 13 core modules (e.g., `invoices`, `payroll`, `recruitment`) are stubbed out. 
- In the **backend**, they exist as placeholder routes returning `{ module: '...', status: 'wip' }`.
- In the **frontend**, they exist as pages rendering a `<PageHeader>` and an `<EmptyState>`.
The next phase of development involves fleshing out the schemas, controllers, and UIs for these specific domains.

## 5. Endpoints & App Behavior Context

### URLs & Ports
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API Base URL**: `http://localhost:4000/api/v1`

### API Endpoints
- The backend API (`apps/api`) does **not** have a root route handler at exactly `/api/v1`. Accessing `http://localhost:4000/api/v1` in a browser will return a 404 Not Found.
- Valid API endpoints are mapped by modules. For example:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/users`
  - `GET /api/v1/finance/invoices`

## 6. Development Workflow Commands

- **Install**: `pnpm install`
- **Database Services**: `docker compose up -d`
- **Migrations**: `pnpm db:migrate`
- **Seed Database**: `pnpm db:seed`
- **Start Development Server**: `pnpm dev` (Starts Next.js on port 3000 and Fastify on port 4000)
