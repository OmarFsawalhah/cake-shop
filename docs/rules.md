# Stage 3 — Rules and Knowledge Base

Rules carry stable IDs so every rule traces to an automated test (`BR-XX → test name`). Three categories: **Business Rules (BR)**, **Visualizer Rules (VR)** which form the knowledge base for the 3D engine, and **Validation Rules (VAL)** at the input boundary.

## 1. Business Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-01 | A custom cake must have between 1 and 5 layers (inclusive) | DB CHECK + Zod |
| BR-02 | Each layer has exactly one flavor; flavors may repeat across layers | Schema |
| BR-03 | A custom cake may have 0..N toppings; no duplicate topping on the same cake | PK on `custom_cake_topping` |
| BR-04 | `price = shape.price_modifier + size_factor × layer_count + Σ(layer.flavor.price_modifier) + Σ(topping.price)` | Service layer (single function) |
| BR-05 | Delivery date must be at least 24 hours after order creation | Service + Zod |
| BR-06 | Orders in status `delivered` or `cancelled` are immutable | Service guard |
| BR-07 | Only admins may change order status | Role guard |
| BR-08 | Customers may cancel only while order status is `pending` | Service guard |
| BR-09 | Online payment must reach `paid` before an order can leave `pending` | Stripe webhook + service |
| BR-10 | Catalog items with `is_active = false` (or `is_available = false` for options) cannot be added to new orders; remain visible on historical orders | Service guard |
| BR-11 | A `cart_item` / `order_item` references exactly one of `cake` xor `custom_cake` | DB CHECK + Zod |
| BR-12 | A user has at most one cart | DB UNIQUE on `cart.user_id` |
| BR-13 | A user may review a cake only once they have a `delivered` order containing that cake | Service guard |
| BR-14 | Cancelling an online-paid order triggers a refund (status → `refunded`) | Service + Stripe API |
| BR-15 | An order must contain at least one item | Service guard at checkout |
| BR-16 | An order must specify a delivery address belonging to the placing user | Service guard |

## 2. Order State Machine

```
pending ──admin──▶ confirmed ──admin──▶ baking ──admin──▶ ready ──admin──▶ out_for_delivery ──admin──▶ delivered
   │                  │                    │
   │ (customer or     │                    │
   │  admin)          ▼                    ▼
   └──▶ cancelled ◀── admin ──────── admin ┘
              │
              └──(if online paid)──▶ refunded
```

Each arrow is implemented by a service method that asserts the precondition state. Invalid transitions throw `InvalidStateTransitionError`.

## 3. Visualizer Knowledge Base (VR)

The visualizer is a pure function of the cake spec. The mapping from spec field → 3D scene operation:

| ID | Input | Visualizer Action |
|---|---|---|
| VR-01 | `shape` | Load corresponding base mesh from `Shape.modelAssetUrl` (`.glb`) |
| VR-02 | `layerCount = N` | Stack N tier meshes; each upper tier scaled to 85% of the tier below |
| VR-03 | `layers[i].flavor` | Apply PBR material from a flavor→material map (chocolate=brown, vanilla=cream, strawberry=pink, ...) to layer i |
| VR-04 | `frosting` | Apply outer shell material (smooth, whipped, fondant) replacing the default |
| VR-05 | `toppings` | Instance topping models on the top tier using a deterministic scatter (seeded by `customCakeId`) |
| VR-06 | `colorHex` | Tint the frosting material's `baseColor` |
| VR-07 | `messageText` | Render as a `Text3D` decal on the front face of the bottom tier; truncate at 30 chars |
| VR-08 | any change | Re-render must complete within 100ms (NFR-01); use React Three Fiber concurrent rendering |

### Default scene
- Camera: orbit camera, initial position `(0, 1.5, 3)` looking at origin
- Lighting: 1 directional key light, 1 fill light, ambient at 0.3
- Background: neutral light grey
- Ground: subtle shadow plane

### Flavor → Material Table (initial seed data)
| Flavor | Base color | Roughness | Notes |
|---|---|---|---|
| Chocolate | `#3b2412` | 0.6 | matte |
| Vanilla | `#f3e5ab` | 0.5 | matte |
| Strawberry | `#f7a8b8` | 0.5 | matte |
| Red Velvet | `#a02334` | 0.55 | matte |
| Lemon | `#fff066` | 0.45 | semi-glossy |
| Coffee | `#6f4e37` | 0.55 | matte |

## 4. Validation Rules (VAL)

| ID | Field | Rule |
|---|---|---|
| VAL-01 | email | Must match RFC-5322 simple regex; lowercased on save |
| VAL-02 | password | Min 8 chars, at least one upper, one lower, one digit |
| VAL-03 | phone | E.164 format (`+countryCode...`) |
| VAL-04 | address.* | All required, postal code matches country pattern |
| VAL-05 | quantity | Integer ≥ 1, ≤ 100 |
| VAL-06 | colorHex | Matches `^#[0-9a-fA-F]{6}$` |
| VAL-07 | messageText | Max 30 chars, no emojis or control chars |
| VAL-08 | rating | Integer 1..5 |
| VAL-09 | deliveryDate | ISO datetime, ≥ now + 24h, ≤ now + 90d |
| VAL-10 | cart at checkout | Must be non-empty (BR-15) |

## 5. Price Calculator (BR-04 reference implementation)

```ts
// apps/api/src/custom-cakes/pricing.ts
const SIZE_FACTOR: Record<string, number> = {
  small: 1.0,
  medium: 1.5,
  large: 2.2,
};

export function calculateCustomCakePrice(spec: {
  shape: { priceModifier: number };
  size: keyof typeof SIZE_FACTOR;
  layers: { flavor: { priceModifier: number } }[];
  toppings: { price: number }[];
}): number {
  const shape = Number(spec.shape.priceModifier);
  const layersCost = spec.layers.reduce(
    (sum, l) => sum + Number(l.flavor.priceModifier),
    0,
  );
  const toppingsCost = spec.toppings.reduce(
    (sum, t) => sum + Number(t.price),
    0,
  );
  const sizeFactor = SIZE_FACTOR[spec.size];
  return Number(
    (shape + sizeFactor * spec.layers.length + layersCost + toppingsCost).toFixed(2),
  );
}
```

## 6. Rule → Test Traceability

Each rule MUST have at least one automated test. Maintain a table here as tests are added:

| Rule | Test file | Test name |
|---|---|---|
| BR-01 | `apps/api/src/custom-cakes/pricing.spec.ts` | _(to add)_ rejects 0 layers / 6 layers |
| BR-04 | `apps/api/src/custom-cakes/pricing.spec.ts` | _(to add)_ computes expected price |
| BR-05 | `apps/api/src/orders/orders.service.spec.ts` | _(to add)_ rejects delivery < 24h |
| BR-08 | `apps/api/src/orders/orders.service.spec.ts` | _(to add)_ customer cancel only when pending |
| BR-11 | `apps/api/src/cart/cart.service.spec.ts` | _(to add)_ rejects item with both refs |
