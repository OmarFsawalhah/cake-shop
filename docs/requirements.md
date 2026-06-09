# Stage 1 — Requirements Specification

## 1. Overview
A web application for a cake shop that lets customers buy pre-made cakes and design custom cakes with a live 3D visualizer, and lets admins manage incoming orders and communicate with customers until delivery.

**Users**
- **Customer** — end user buying cakes
- **Admin** — shop operator managing the catalog, orders, and deliveries

## 2. Functional Requirements

### 2.1 Customer
| ID | Requirement |
|---|---|
| FR-C-01 | Register with name, email, phone, and password |
| FR-C-02 | Log in / log out with email and password |
| FR-C-03 | Reset password via email link |
| FR-C-04 | Browse a catalog of pre-made cakes |
| FR-C-05 | Filter and search cakes by category, price range, and flavor |
| FR-C-06 | View cake detail page (images, description, ingredients, price, allergens) |
| FR-C-07 | Add a cake to the cart and adjust quantity |
| FR-C-08 | Remove items from the cart |
| FR-C-09 | Open the **Custom Cake Builder** with a split-screen layout |
| FR-C-10 | Choose cake shape (round, square, heart, ...) on the left panel |
| FR-C-11 | Choose number of layers (1–5) |
| FR-C-12 | Choose flavor per layer |
| FR-C-13 | Choose frosting type |
| FR-C-14 | Choose one or more toppings (no duplicates) |
| FR-C-15 | Choose a base color (color picker, applied to frosting) |
| FR-C-16 | Optionally type a short message rendered on the cake |
| FR-C-17 | See the 3D visualizer on the right panel update live for every change |
| FR-C-18 | See the current computed price update live |
| FR-C-19 | Add the configured custom cake to the cart |
| FR-C-20 | Manage saved delivery addresses |
| FR-C-21 | Place an order: choose address, delivery date/time, payment method |
| FR-C-22 | Pay online via Stripe or choose cash on delivery |
| FR-C-23 | View order history with current status |
| FR-C-24 | Cancel an order while its status is `pending` |
| FR-C-25 | Exchange messages with admin about a specific order |
| FR-C-26 | Rate and review a delivered cake |

### 2.2 Admin
| ID | Requirement |
|---|---|
| FR-A-01 | Log into the admin panel (role = admin only) |
| FR-A-02 | View dashboard: today's orders, pending orders, revenue |
| FR-A-03 | List all orders with filters by status, date, customer |
| FR-A-04 | View order details, including the saved custom-cake configuration |
| FR-A-05 | View an admin-side 3D preview of any custom cake on an order |
| FR-A-06 | Update order status through the workflow |
| FR-A-07 | Message the customer about an order |
| FR-A-08 | Create, edit, deactivate pre-made cakes in the catalog |
| FR-A-09 | Manage available shapes, flavors, toppings, and their prices |
| FR-A-10 | Upload images for catalog items |
| FR-A-11 | View basic reports (orders by day, top cakes) |

## 3. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Performance — visualizer responsiveness | ≤ 100 ms per option change on mid-range laptop |
| NFR-02 | Performance — page load (first contentful paint) | ≤ 2.5 s on broadband |
| NFR-03 | Availability | 99% uptime monthly |
| NFR-04 | Security — passwords | bcrypt/argon2 hashed, never stored plaintext |
| NFR-05 | Security — transport | HTTPS only, HSTS enabled |
| NFR-06 | Security — payments | All card data handled by Stripe; PCI scope minimized |
| NFR-07 | Security — access control | Role-based; admins only via `role=admin` |
| NFR-08 | Usability — responsive | Desktop primary; tablet and mobile usable |
| NFR-09 | Accessibility | WCAG 2.1 AA on all customer-facing pages |
| NFR-10 | Localization | English required; Arabic (RTL) optional v2 |
| NFR-11 | Scalability | Handle 500 concurrent customers during peak |
| NFR-12 | Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |

## 4. Order Status Workflow

```
pending → confirmed → baking → ready → out_for_delivery → delivered
                ↘ cancelled (terminal)
                ↘ refunded (terminal, for online-paid cancellations)
```

- `pending` is the initial state.
- Customer can self-cancel only while `pending`.
- Admin advances state; once `delivered` or `cancelled`, the order is immutable.

## 5. Order State — Allowed Transitions

| From | To (admin) | To (customer) |
|---|---|---|
| pending | confirmed, cancelled | cancelled |
| confirmed | baking, cancelled | — |
| baking | ready, cancelled | — |
| ready | out_for_delivery | — |
| out_for_delivery | delivered | — |
| delivered | (terminal) | — |
| cancelled | refunded (if online-paid) | — |

## 6. Out of Scope (v1)
- Native mobile apps
- Multiple shop branches / franchise management
- Loyalty points and referral programs
- Subscription / recurring orders
- Third-party delivery integrations (Uber/Talabat) — manual contact for v1

## 7. Acceptance Criteria (Examples)
- **AC-01** A customer can build a 3-layer chocolate cake with 2 toppings and see the 3D visualizer update within 100 ms of each change.
- **AC-02** A customer placing a Stripe order receives an emailed confirmation within 60 seconds and sees status = `confirmed` after payment succeeds.
- **AC-03** Admin cannot delete an order; deactivating a catalog item hides it from new orders but keeps it visible on historical orders.
- **AC-04** A non-admin user attempting to access `/admin/*` is redirected to login and denied.
