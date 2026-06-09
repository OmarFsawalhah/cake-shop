# Stage 4 — Architecture and Technology Stack

## 1. High-Level Diagram

```
              ┌──────────────────────────────┐
              │   Customer Browser (SPA)     │
              │   React + Vite + TS          │
              │   React Three Fiber (3D)     │
              └──────────────┬───────────────┘
                             │ HTTPS (REST + WebSocket)
                             ▼
              ┌──────────────────────────────┐
              │   Admin Browser (same SPA,   │
              │   role-gated /admin routes)  │
              └──────────────┬───────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │           NestJS API (Node 20)             │
        │  Auth · Catalog · Cart · Orders · Payments │
        │  Messages (Socket.IO) · Webhooks           │
        └─────┬──────────────────┬─────────────┬─────┘
              │                  │             │
              ▼                  ▼             ▼
       ┌─────────────┐   ┌─────────────┐  ┌────────────┐
       │ PostgreSQL  │   │   Stripe    │  │ Cloudinary │
       │ (Prisma)    │   │  Payments   │  │  / S3      │
       └─────────────┘   └─────────────┘  └────────────┘
              ▲                                  ▲
              │                                  │
              └──── Sentry · Logs · Metrics ─────┘
```

## 2. Frontend Architecture

### Stack
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** for routing
- **Zustand** for cart/auth/builder state (lightweight, no boilerplate)
- **TanStack Query** for server state (catalog, orders) with cache + retries
- **Tailwind CSS** + **shadcn/ui** for styling and primitives
- **React Three Fiber** + **@react-three/drei** + **three** for the 3D visualizer
- **React Hook Form** + **Zod** for forms and validation
- **Socket.IO client** for admin–customer chat

### Folder layout (`apps/web/src`)
```
app/                # router, layout shell
features/
  auth/             # login, register, reset
  catalog/          # listing, detail
  cart/             # cart drawer, line items
  custom-cake/      # split-screen builder
    components/
      SpecForm.tsx
      CakeVisualizer.tsx       # <Canvas> entry
      meshes/
        BaseTier.tsx
        ToppingScatter.tsx
        MessageDecal.tsx
    hooks/
      useCakeSpec.ts            # Zustand store
      useCakePrice.ts
  checkout/         # address, payment selection, Stripe Elements
  orders/           # customer order history + detail
  admin/            # dashboard, orders, catalog management, chat
components/         # shared UI (buttons, layout)
lib/                # api client, zod schemas, formatters
```

### Visualizer rendering pipeline (Stage 3 VR-01..VR-08 implementation)
1. `useCakeSpec` Zustand store holds the current `CakeSpec`
2. `SpecForm` writes to the store via controlled inputs
3. `CakeVisualizer` subscribes; on every store change React Three Fiber re-renders the scene using the **knowledge-base mapping** from `docs/rules.md` §3
4. Heavy meshes (`.glb` models for shapes and toppings) are preloaded via `useGLTF.preload`
5. A single `useFrame` loop handles subtle ambient rotation

## 3. Backend Architecture

### Stack
- **NestJS 10** (TypeScript) — modular, opinionated, scales well past MVP
- **Prisma 5** ORM + **PostgreSQL 16**
- **JWT** (15-min access) + **refresh tokens** (rotating, in httpOnly cookie)
- **Passport** strategies (`local`, `jwt`) wired via Nest
- **class-validator** + Zod at controller boundaries
- **Socket.IO** via `@nestjs/websockets` for messages
- **Stripe SDK** for payments and webhooks
- **Multer + Cloudinary SDK** for image upload

### Module layout (`apps/api/src`)
```
auth/         # AuthModule, AuthService, JwtStrategy, RolesGuard
users/        # User CRUD
cakes/        # Pre-made cake catalog
custom-cakes/ # CustomCake CRUD, pricing service (BR-04)
cart/         # Cart + CartItem (XOR rule BR-11)
orders/       # Order state machine (BR-06..BR-09)
payments/     # Stripe integration + webhook controller
messages/     # WebSocket gateway, persistence
common/       # decorators, guards, pipes, prisma module, exceptions
```

### Cross-cutting
- `PrismaModule` exports a singleton `PrismaService`
- `RolesGuard` + `@Roles('admin')` decorator for admin-only endpoints
- Global `ZodValidationPipe` for request DTOs
- Global `HttpExceptionFilter` for consistent error envelopes
- `pino` logger + request ID middleware

## 4. Authentication & Authorization

- Registration → bcrypt-hash password (cost 12) → user row created with `role=customer`
- Login → issue access token (15 min) + refresh token (7 d) in `Set-Cookie httpOnly; SameSite=Strict; Secure`
- All `/api/*` routes (except `/auth/*`, `/cakes` GET, `/health`) require valid JWT
- `/admin/*` routes additionally require `role=admin`
- Refresh endpoint rotates tokens; previous refresh token invalidated on use
- Admin seed user created via Prisma seed script (env-configurable email/password)

## 5. Payments Flow

### Online (Stripe)
1. Client calls `POST /orders` with `payment_method=online` → server creates `Order(status=pending, paymentStatus=pending)` and a Stripe Payment Intent
2. Client confirms the Payment Intent via Stripe Elements
3. Stripe sends webhook `payment_intent.succeeded` → server marks `Payment.status=paid`, `Order.paymentStatus=paid`, advances order to `confirmed` (BR-09)
4. Failure webhook → `Order.paymentStatus=failed`, `Order` stays `pending` (customer can retry or cancel)

### Cash on Delivery
1. `POST /orders` with `payment_method=cash` → `Order(status=pending, paymentStatus=unpaid)`
2. Admin manually advances to `confirmed`
3. On delivery, admin marks `paymentStatus=paid`

## 6. Data Flow Examples

### Build & buy a custom cake
```
User opens /custom-cake
  → Web fetches GET /options (shapes, flavors, toppings) [cached by TanStack Query]
  → Builder renders with defaults
  → On each form change:
       - Zustand store updated
       - 3D scene re-renders (VR rules)
       - Price recomputed client-side (BR-04 mirror) for instant UX
  → User clicks "Add to cart"
       - POST /custom-cakes  → server computes authoritative price → returns customCakeId
       - POST /cart/items    { customCakeId, quantity }
```

### Place an order
```
POST /orders { addressId, paymentMethod, deliveryDate }
  → server validates BR-05, BR-15, BR-16, BR-11, BR-10
  → creates Order + OrderItem rows in a transaction
  → if online: creates Stripe Payment Intent, returns client_secret
  → if cash:   returns orderId immediately
Customer pays / waits for admin contact
```

## 7. Deployment Topology

| Component | Hosting | Notes |
|---|---|---|
| Frontend (`apps/web`) | **Vercel** | Static + edge; previews per PR |
| Backend (`apps/api`) | **Railway** or **Fly.io** | Docker image, autoscale 1..3 |
| Database | **Railway Postgres** or **Neon** | Daily backups, point-in-time recovery |
| Object storage | **Cloudinary** | Cake images, `.glb` 3D models |
| Email | **Resend** | Order confirmations, status updates |
| Errors | **Sentry** | Frontend + backend DSNs |
| Analytics | **PostHog** | Product analytics, funnels |

### Environment variables
```
# api
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUDINARY_URL=
RESEND_API_KEY=
SENTRY_DSN=

# web
VITE_API_BASE_URL=
VITE_STRIPE_PUBLIC_KEY=
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
```

## 8. Testing & CI

- **Unit**: Vitest (web) + Jest (api). Pricing, validation, state machine.
- **Integration**: NestJS `Test.createTestingModule` against a throwaway Postgres (Docker) via `testcontainers`.
- **E2E**: Playwright covering: register → build custom cake → checkout (cash) → admin advances → delivered.
- **CI** (GitHub Actions): on each PR — install, lint, typecheck, test (web + api), build. Required to pass before merge.

## 9. Observability

- Request log line per HTTP request with `requestId`, `userId` (if any), latency, status
- Sentry captures unhandled exceptions and React error boundaries
- Healthcheck endpoint `GET /health` returns DB connectivity + uptime
- Stripe webhook deliveries logged with signature verification outcome
