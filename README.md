# Antrosys ERP

A full-stack enterprise resource planning system built with Next.js 14, Fastify, Prisma, and PostgreSQL.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker** (for PostgreSQL & Redis)

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start database services
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Run database migrations
pnpm db:migrate

# 5. Seed demo data
pnpm db:seed

# 6. Start development servers
pnpm dev
```

## Access URLs

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000         |
| API      | http://localhost:4000         |
| API Docs | http://localhost:4000/health  |

## Seed Credentials

All demo accounts use password: `Antrosys@2026`

| Role              | Email                          |
| ----------------- | ------------------------------ |
| CEO               | ceo@antrosys.com               |
| CFO               | cfo@antrosys.com               |
| Operations Head   | operations_head@antrosys.com   |
| HR Head           | hr_head@antrosys.com           |
| Finance Manager   | finance_manager@antrosys.com   |
| Project Manager   | project_manager@antrosys.com   |
| Manager           | manager@antrosys.com           |
| Team Lead         | team_lead@antrosys.com         |
| Employee          | employee@antrosys.com          |

## Monorepo Structure

```
antrosys-erp/
├── apps/
│   ├── web/            # Next.js 14 frontend
│   └── api/            # Fastify + Prisma backend
├── packages/
│   └── types/          # Shared TypeScript types
├── docker-compose.yml  # PostgreSQL + Redis
├── turbo.json          # Turborepo config
└── package.json        # Root workspace
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Zustand, React Query
- **Backend**: Fastify, Prisma ORM, PostgreSQL, Redis, JWT Auth
- **Tooling**: Turborepo, pnpm workspaces, TypeScript
