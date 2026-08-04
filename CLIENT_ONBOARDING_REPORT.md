# How Client Onboarding Is Currently Handled in Antrosys ERP

**Date:** 2026-08-04
**Scope:** `apps/api` (Fastify) + `apps/web` (Next.js) + `packages/types` (RBAC)

---

## 1. Executive Summary

Antrosys does **not** have a dedicated "client onboarding" workflow. Unlike employee onboarding — which has a first-class module (`/api/v1/onboard`) with a persisted `OnboardingRecord`, phases (`PENDING → DOCUMENTATION → IT_SETUP → HR_ORIENTATION → TEAM_INTRO → COMPLETED`), and scheduled meetings — client onboarding has **no separate model, phase state machine, or checklist**.

Client onboarding is currently handled **implicitly through the generic Client Lifecycle Management module** (`clients` module). A client "arrives" by being created as a `PROSPECT` row, and is then nudged through the sales/pipeline stages and given tasks, projects, contacts, and invoices by hand. The closest thing to an onboarding workflow is a combination of:

1. Creating the client record (manual form or bulk CSV import).
2. Moving the client through the **pipeline stage** (`PROSPECT → PROPOSAL → NEGOTIATION → ACTIVE → AT_RISK`).
3. Moving the client through the **sales stage** (`INITIAL_CONTACT → PROPOSAL → NEGOTIATION → CONTRACT_REVIEW → CLOSED_WON`) on a kanban board.
4. Manually attaching the building blocks of an onboarded client: **contacts, projects, tasks, activities, and the first invoice**.

---

## 2. Data Model (Prisma — `apps/api/prisma/schema.prisma`)

Client data is spread across 8 models, all keyed off the root `Client` (schema.prisma:377):

| Model | Purpose | Key fields |
|---|---|---|
| `Client` | Root record | `clientCode`, `name`, `email`, `phone`, `industry`, `tier`, `pipelineStage`, `salesStage`, `monthlyRevenue`, `annualRevenue`, `lifetimeValue`, `currencyCode`, `healthScore`, `renewalDueAt`, `isAtRisk`, `isActive` |
| `ClientContact` | People at the client | `name`, `email`, `phone`, `role`, `isPrimary` |
| `ClientStatus` | Pipeline history log | `status` (free-text, holds pipeline stage), `note` |
| `ClientRenewal` | Contract renewals | `dueAt`, `completedAt`, `amount`, `status` |
| `ClientActivity` | Interaction log | `type` (NOTE/CALL/EMAIL/MEETING/…), `title`, `description` |
| `ClientProject` | Work delivered | `status`, `priority`, `projectManager`, `startDate`, `endDate`, `budget` |
| `ClientTask` | Action items (incl. onboarding follow-ups) | `title`, `dueAt`, `completedAt`, `priority`, `status` |
| `ClientTimelineEvent` | Event feed | `eventType`, `title`, `description`, `metadata`, `eventDate` |

### Stage enums (schema.prisma:86–100)

```
ClientPipelineStage: PROSPECT | PROPOSAL | NEGOTIATION | ACTIVE | AT_RISK
ClientSalesStage:    INITIAL_CONTACT | PROPOSAL | NEGOTIATION | CONTRACT_REVIEW | CLOSED_WON
```

Note there is **no `ONBOARDING` state** anywhere in the client model, and no `ClientOnboarding`/checklist table. The only `ONBOARDING` string in the DB belongs to the **employee** domain (`EmploymentStatus.ONBOARDING`) and `OnboardingStatus`/`OnboardingPhase`.

---

## 3. Backend (Fastify API)

### 3.1 Registration
`clientsRoutes` is registered at prefix `/api/v1/clients` (app.ts:107). All routes require a valid JWT (`verifyJwt` pre-handler) plus one of two permissions.

### 3.2 Endpoints (clients.routes.ts)

**Dashboard aggregates** (all `clients:read`):
- `GET /summary` — KPIs, lifecycle distribution, upcoming renewals, prospect pipeline
- `GET /pipeline` — sales-pipeline grouped by sales stage
- `GET /recent-timeline` — global event feed
- `GET /upcoming-tasks` — pending/in-progress tasks across all clients
- `GET /alerts` — at-risk clients with low health + upcoming renewals

**Bulk operations:**
- `GET /export` (`clients:read`) — CSV download
- `POST /import` (`clients:write`) — CSV bulk create (used for bulk client onboarding)

**Client CRUD:**
- `GET /` — paginated list with search/pipeline/risk/active filters (`clients:read`)
- `GET /:clientId` — full detail with nested contacts, statuses, renewals, activities, projects, tasks, timeline, invoices (`clients:read`)
- `POST /` — **create client** (`clients:write`)
- `PATCH /:clientId` — update (`clients:write`)
- `DELETE /:clientId` — delete (`clients:write`)
- `PATCH /:clientId/sales-stage` — move sales stage (`clients:write`)

**Sub-resources** (nested under `/:clientId`):
- `GET /statuses`, `GET|POST /renewals`, `PATCH /renewals/:id`
- `GET|POST /activities`
- `GET|POST /projects`, `PATCH /projects/:id`
- `GET|POST /tasks`, `PATCH /tasks/:id`
- `GET /timeline`
- `GET|POST /contacts`, `PATCH|DELETE /contacts/:id`

### 3.3 How creation/onboarding is wired (clients.service.ts)

**`createClient`** (clients.service.ts:149) runs a DB transaction that:
1. Creates the `Client` (defaults: `pipelineStage=PROSPECT`, `isActive=true`, `healthScore=75`, `currencyCode` required).
2. Writes an initial `ClientStatus` row — *"Client created"*.
3. Pushes a `ClientTimelineEvent` of type `CREATED`.
4. Writes an `AuditLog` entry (`CLIENT_CREATE`).

**Implicit onboarding happens by manually invoking:**
- `createContact` — add the client's people (primary contact enforced).
- `createProject` — stand up delivered work; recalculates client ARR/MRR automatically.
- `createTask` — e.g., seeded follow-ups like *"Initial sync with Orbital"*.
- `createActivity` — log kickoff calls/meetings.
- `createInvoice` — finance side (`/api/v1/invoices`), not part of this module.
- `updateClient` / `updateClientSalesStage` / `updateProject` — moving stages.

Every mutation also pushes a **timeline event** (`STATUS_CHANGED`, `PROJECT_STARTED`, `PROJECT_COMPLETED`, `TASK_COMPLETED`, `RENEWAL_DUE`, …) and an **audit log** entry, so a de-facto onboarding history exists on the timeline.

### 3.4 Validation (clients.schema.ts)
All bodies are Zod-validated. Creation fields: `name` (required), `clientCode`, `email`, `phone`, `industry`, `tier`, `pipelineStage` (default `PROSPECT`), `salesStage`, `currencyCode` (default `PKR`), `renewalDueAt`, `isAtRisk`, `isActive`, `healthScore`, `lifetimeValue`.

### 3.5 RBAC
- `clients:read` — **CEO** (all), **CFO**, **PROJECT_MANAGER** (read only).
- `clients:write` — **CEO only** (permissions.ts:64–140).
- Consequence: in practice only the CEO role can create clients or advance their stages today.

---

## 4. Frontend (Next.js)

### 4.1 Page — `apps/web/src/app/(dashboard)/clients/page.tsx`
Single-page client management dashboard (`/clients`). Sections, top to bottom:
1. **Header** — search box, CSV Import/Export buttons, "Add client" button (gated on `clients:write`).
2. **KPI metrics** (`client-metrics.tsx`) — driven by `/clients/summary`.
3. **Master–detail workspace** — `ClientList` + `ClientDetail` (auto-selects first client).
4. **Alert banner** — from `/clients/alerts` (at-risk clients with low health).
5. **Sales Pipeline board** (`sales-pipeline.tsx`) — kanban across the 5 sales stages; move cards to advance.
6. **Interaction timeline + Upcoming tasks** — global feed and task panel.

### 4.2 "Add Client" modal — `client-dialogs.tsx`
The **only onboarding entry point** in the UI. Captures: `name`, `clientCode`, `industry`, `email`, `phone`, `tier`, and a `pipelineStage` dropdown (default `PROSPECT`). `currencyCode` is hardcoded to `PKR` client-side. It calls `createClient` → `POST /clients`. There is no step-by-step onboarding form, no checklist, no multi-phase wizard.

### 4.3 Detail panel — `client-detail.tsx`
Five tabs: **Overview | Projects | Invoices | Contacts | Activity**. Post-creation setup is done here manually:
- Add/delete **contacts** (`client-contacts.tsx`)
- Add/edit **projects** with budgets (`client-projects.tsx`)
- View/send **invoices** (`client-invoices.tsx`)
- Log **activities**
- **Overview** shows ARR / MRR / LTV, pipeline stage, health.

### 4.4 API client — `clients-api.ts`
Typed wrappers over every endpoint above (React Query, cache keys like `["client-summary"]`, `["clients"]`, `["client", id]`). Stage moves and CRUD invalidate the relevant queries to refresh the board/timeline.

### 4.5 Seed data — `clients.seed.ts`
Seeds ~34 clients across stages (`ACTIVE`, `AT_RISK`, `PROSPECT`, `PROPOSAL`, `NEGOTIATION`), contacts, tasks, timeline events, activities, and linked invoices — used to demo the lifecycle dashboard.

---

## 5. The Current "Onboarding" Journey (as-is)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. ENTER   CEO clicks "Add client" (or CSV import) → Client created at     │
│            PROSPECT + timeline "CREATED" event + initial ClientStatus.     │
│ 2. PITCH   Sales stage INITIAL_CONTACT → PROPOSAL (kanban move).           │
│ 3. CLOSE   Negotiation → CONTRACT_REVIEW → CLOSED_WON.                     │
│ 4. ACTIVATE Manual: pipeline stage → ACTIVE; add contacts, first project,  │
│            onboarding tasks (e.g. "initial sync"), first invoice, renewal. │
│ 5. MAINTAIN Renewals, health score, at-risk monitoring, alerts.            │
└────────────────────────────────────────────────────────────────────────────┘
```
Everything in steps 2–4 is **manual and user-driven**. The system only records what happened; it does not *drive* an onboarding process.

---

## 6. Gaps & Observations

1. **No formal onboarding model** — no `ClientOnboarding` table, no `ONBOARDING` phase, no checklist/SLA items, no onboarding start/completion dates on the client.
2. **No automated handoff** — marking a deal `CLOSED_WON` does not auto-advance pipeline stage, create a kickoff task, a first project, or notify an onboarding owner.
3. **Two parallel tracks can drift** — `pipelineStage` and `salesStage` are updated independently (`PATCH /clients/:id` vs `PATCH /clients/:id/sales-stage`) with no invariant linking `CLOSED_WON` to `ACTIVE`.
4. **Single-owner write access** — only `CEO` holds `clients:write`; no onboarding/CSM/account-manager role can drive the process today.
5. **Onboarding is duplicated in unrelated places** — e.g., the seeded *"Initial sync with Orbital"* task lives in `ClientTask` with no template mechanism, so every client's setup must be re-typed.
6. **No notification/automation** — stage changes, task due dates, and renewals don't emit in-app notifications or approval workflows (unlike, e.g., invoices → `ApprovalTask`).
7. **Terminology collision** — `onboard` module is employee-focused; "client onboarding" is ambiguous in the codebase and has no owning module.

---

## 7. Appendix — File Map

| Concern | Location |
|---|---|
| Routes | `apps/api/src/modules/clients/clients.routes.ts` |
| Controllers | `apps/api/src/modules/clients/clients.controller.ts` |
| Service (business logic) | `apps/api/src/modules/clients/clients.service.ts` |
| Zod schemas | `apps/api/src/modules/clients/clients.schema.ts` |
| Registration | `apps/api/src/app.ts:107` (`/api/v1/clients`) |
| Prisma models | `apps/api/prisma/schema.prisma:377–530` |
| Seed data | `apps/api/prisma/seed/clients.seed.ts` |
| Page | `apps/web/src/app/(dashboard)/clients/page.tsx` |
| API client | `apps/web/src/app/(dashboard)/clients/lib/clients-api.ts` |
| Dialogs (Add/Edit) | `apps/web/src/app/(dashboard)/clients/components/client-dialogs.tsx` |
| Detail panel | `apps/web/src/app/(dashboard)/clients/components/client-detail.tsx` |
| Permissions | `packages/types/src/permissions.ts` (`clients:read`, `clients:write`) |

---

## 8. Recommendation (for planning a real onboarding workflow)

If a true client-onboarding flow is desired, it would likely introduce:
- A `ClientOnboarding` model (1:1 with `Client`) with phases like `KICKOFF → SETUP → HANDBACK → COMPLETED`, checklist items, and an owner.
- A template engine for kickoff tasks/projects on `CLOSED_WON`.
- An `ONBOARDING` value in `ClientPipelineStage` (or a mapping rule `CLOSED_WON → ONBOARDING → ACTIVE`).
- A new permission (e.g., `clients:onboard`) and an `ACCOUNT_MANAGER`/CSM role.
- Notifications/wiring to the existing `ApprovalTask` and `notifications` modules.
