# Cake Shop

Web application for a cake shop with a customer storefront, a 3D custom cake builder, and an admin order management panel.

## Documentation

- [Requirements](docs/requirements.md) — Stage 1
- [ER Model](docs/er-diagram.md) + [`schema.sql`](docs/schema.sql) + [`prisma/schema.prisma`](prisma/schema.prisma) — Stage 2
- [Rules & Knowledge Base](docs/rules.md) — Stage 3
- [Architecture](docs/architecture.md) — Stage 4

## Project Layout

```
cake-shop/
├── apps/
│   ├── web/          # React + Vite + TS (customer + admin SPA)
│   └── api/          # NestJS + Prisma + PostgreSQL
├── prisma/           # Prisma schema (shared)
├── docs/             # Project documentation
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for Postgres)
- npm 10+

## Quick Start

```powershell
# 1. Install dependencies for the monorepo
npm install

# 2. Start Postgres
docker compose up -d db

# 3. Copy env template and fill in values
copy .env.example .env

# 4. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# 5. Start API and Web in dev mode (parallel terminals)
npm run dev -w apps/api
npm run dev -w apps/web
```

Web: http://localhost:5173  
API: http://localhost:3000

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run dev servers for all workspaces |
| `npm run build` | Production build for all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run unit + integration tests |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Roadmap

See sprint plan in [the original project plan](../../Users/Omar2/.claude/plans/i-need-to-put-compressed-cocke.md):

1. **Sprint 1** — Foundations (this scaffold)
2. **Sprint 2** — Catalog & Cart
3. **Sprint 3** — Custom Cake Builder (3D)
4. **Sprint 4** — Checkout & Orders
5. **Sprint 5** — Admin Panel
6. **Sprint 6** — Polish & Launch
