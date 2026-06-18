# Antrosys ERP Architecture & Structure

This repository is a monorepo managed by **Turborepo** and **pnpm workspaces**. It contains both the Next.js frontend and the Fastify backend, along with shared TypeScript packages.

## Monorepo Layout

```
antrosys_erp/
├── apps/
│   ├── api/            # Backend (Node.js + Fastify + Prisma)
│   └── web/            # Frontend (Next.js 14 + shadcn/ui)
├── packages/
│   └── types/          # Shared TypeScript types used by both api and web
├── prisma/             # (Inside apps/api) Database schema & migrations
├── docker-compose.yml  # Docker infrastructure (PostgreSQL + Redis)
├── turbo.json          # Turborepo task pipeline configuration
├── package.json        # Root package with monorepo scripts
└── pnpm-workspace.yaml # Defines the workspaces for pnpm
```

## Detailed Directory Breakdown

### 1. `apps/web/` (Frontend)
This is a modern web application built with Next.js 14 App Router, React, Tailwind CSS, and shadcn/ui.
- **Purpose**: Provides the user interface for all ERP roles (Admin, HR, Finance, etc.).
- **Key Folders**:
  - `src/app/`: Next.js App Router structure. Contains `(auth)` for login flows and `(dashboard)` for authenticated pages.
  - `src/components/`: Reusable UI components.
    - `ui/`: Raw shadcn/ui primitives (buttons, inputs, dialogs).
    - `layout/`: Shell components like `Sidebar` and `Topbar`.
    - `shared/`: Common components like `PageHeader` and `EmptyState`.
  - `src/hooks/`: Custom React hooks (e.g., `usePermission`, `use-toast`).
  - `src/stores/`: Zustand state management (e.g., `auth.store.ts`, `ui.store.ts`).
  - `src/lib/`: Utilities, including the Axios `api-client.ts` with auth interceptors.
  - `src/constants/`: Role-based access control and navigation configs.
- **Key Dependencies**:
  - `next`, `react`, `react-dom`
  - `tailwindcss`, `shadcn/ui` (Radix primitives)
  - `zustand` (State management)
  - `@tanstack/react-query` (Data fetching & caching)
  - `next-auth` (Authentication)
  - `react-hook-form` & `zod` (Form validation)

### 2. `apps/api/` (Backend)
This is a robust Node.js API built with Fastify and Prisma ORM.
- **Purpose**: Serves data to the frontend, enforces RBAC (Role-Based Access Control), and interacts with PostgreSQL and Redis.
- **Key Folders**:
  - `src/config/`: Environment validation (`env.ts`), Database singleton (`database.ts`), Redis connection (`redis.ts`).
  - `src/plugins/`: Fastify plugins for authentication (`auth.plugin.ts`), RBAC (`rbac.plugin.ts`), and rate-limiting.
  - `src/modules/`: Feature-based modules (e.g., `auth`, `users`, `hr`, `finance`). Each module has its own routes, controllers, services, and schemas.
  - `src/shared/`: Cross-cutting concerns like middleware (e.g., `audit-logger.ts`).
  - `prisma/`: Prisma schema (`schema.prisma`) defining the database structure, and database seeds (`seed/`).
- **Key Dependencies**:
  - `fastify` (High-performance web framework)
  - `@prisma/client` (Database ORM)
  - `ioredis` (Redis client for caching/sessions)
  - `zod` (Request validation)
  - `jsonwebtoken` & `bcryptjs` (Auth & Cryptography)

### 3. `packages/types/` (Shared Types)
- **Purpose**: Defines common TypeScript contracts (e.g., `Role` enums, `Permission` unions) that are imported by both the frontend and backend to guarantee end-to-end type safety.

---

## Getting Started: How to Run the Project

If a new developer pulls this repository, they need to follow these steps to get the project running locally.

### Prerequisites
- Node.js (v20 or higher)
- pnpm (v9 or higher) - Install via `npm i -g pnpm`
- Docker & Docker Compose (for the database and redis)

### Setup Instructions

1. **Clone the repository & enter the directory**
   ```bash
   git clone <repo-url>
   cd antrosys_erp
   ```

2. **Set up environment variables**
   Copy the example environment file to create your local `.env`.
   ```bash
   cp .env.example .env
   ```
   *Note: The default `.env.example` values are already configured to work with the local Docker setup.*

3. **Start the database services**
   Boot up PostgreSQL and Redis in the background using Docker.
   ```bash
   docker compose up -d
   ```

4. **Install dependencies**
   Install Node packages across the entire monorepo.
   ```bash
   pnpm install
   ```

5. **Generate Prisma Client & Run Migrations**
   Sync the database schema and generate the TypeScript client.
   ```bash
   pnpm db:migrate
   ```

6. **Seed the database**
   Populate the database with the required roles and initial demo users (e.g., CEO, HR Head, Admin).
   ```bash
   pnpm db:seed
   ```

7. **Start the development servers**
   Start both the Next.js frontend and the Fastify backend simultaneously.
   ```bash
   pnpm dev
   ```

### Accessing the App
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Base URL**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

### Login Credentials
The database seed creates users with the following pattern. The password for all test accounts is `Antrosys@2026`.
- ceo@antrosys.com
- cfo@antrosys.com
- hr_head@antrosys.com
- admin@antrosys.com
- *(See `apps/api/prisma/seed/index.ts` for all seeded accounts)*
