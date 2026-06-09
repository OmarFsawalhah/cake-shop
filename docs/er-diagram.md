# Stage 2 — Entity-Relationship Model

The canonical schema is [`prisma/schema.prisma`](../prisma/schema.prisma) and the raw DDL is [`docs/schema.sql`](schema.sql). This document explains entities and relationships and provides a Mermaid diagram you can render into a PNG for the deliverable.

## Mermaid ER Diagram

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o| CART : owns
    USER ||--o{ ORDER : places
    USER ||--o{ CUSTOM_CAKE : designs
    USER ||--o{ REVIEW : writes

    ADDRESS ||--o{ ORDER : ships_to

    CAKE ||--o{ CART_ITEM : referenced_by
    CAKE ||--o{ ORDER_ITEM : referenced_by
    CAKE ||--o{ REVIEW : receives

    CUSTOM_CAKE ||--o{ CART_ITEM : referenced_by
    CUSTOM_CAKE ||--o{ ORDER_ITEM : referenced_by
    CUSTOM_CAKE ||--o{ CUSTOM_CAKE_LAYER : has
    CUSTOM_CAKE }o--o{ TOPPING : decorated_with
    CUSTOM_CAKE }o--|| SHAPE : uses

    CUSTOM_CAKE_LAYER }o--|| FLAVOR : uses

    CART ||--o{ CART_ITEM : contains
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : settled_by
    ORDER ||--o{ MESSAGE : has

    USER {
      string user_id PK
      string name
      string email UK
      string phone
      string password_hash
      enum   role
      datetime created_at
    }
    ADDRESS {
      string address_id PK
      string user_id FK
      string street
      string city
      string postal_code
      bool   is_default
    }
    CAKE {
      string cake_id PK
      string name
      string description
      decimal base_price
      string image_url
      string category
      bool   is_active
    }
    CUSTOM_CAKE {
      string custom_cake_id PK
      string user_id FK
      string shape_id FK
      string size
      int    layer_count
      string frosting
      string message_text
      string color_hex
      decimal computed_price
      datetime created_at
    }
    CUSTOM_CAKE_LAYER {
      string layer_id PK
      string custom_cake_id FK
      int    layer_order
      string flavor_id FK
    }
    SHAPE   { string shape_id PK
              string name
              decimal price_modifier
              string model_asset_url }
    FLAVOR  { string flavor_id PK
              string name
              decimal price_modifier
              bool   is_available }
    TOPPING { string topping_id PK
              string name
              decimal price
              bool   is_available }
    CART    { string cart_id PK
              string user_id FK }
    CART_ITEM {
      string cart_item_id PK
      string cart_id FK
      string cake_id FK
      string custom_cake_id FK
      int    quantity
      decimal unit_price
    }
    ORDER {
      string order_id PK
      string user_id FK
      string address_id FK
      decimal total_amount
      enum   status
      enum   payment_method
      enum   payment_status
      datetime delivery_date
      datetime created_at
    }
    ORDER_ITEM {
      string order_item_id PK
      string order_id FK
      string cake_id FK
      string custom_cake_id FK
      int    quantity
      decimal unit_price
    }
    PAYMENT {
      string payment_id PK
      string order_id FK
      string provider
      string transaction_id
      decimal amount
      enum   status
      datetime paid_at
    }
    REVIEW {
      string review_id PK
      string user_id FK
      string cake_id FK
      int    rating
      string comment
      datetime created_at
    }
    MESSAGE {
      string message_id PK
      string order_id FK
      enum   sender_role
      string body
      datetime sent_at
    }
```

## XOR Constraint on Items

`CART_ITEM` and `ORDER_ITEM` each reference **either** `CAKE` **or** `CUSTOM_CAKE`, never both, never neither. Enforced in two places:

1. **Database** — CHECK constraint:
   `((cake_id IS NOT NULL)::int + (custom_cake_id IS NOT NULL)::int) = 1`
2. **Application** — Zod schema validates the input shape at the API boundary.

## Cardinality Summary

| Relationship | Type |
|---|---|
| User – Address | 1 : N |
| User – Cart | 1 : 0..1 |
| User – Order | 1 : N |
| User – CustomCake | 1 : N |
| Cart – CartItem | 1 : N |
| Order – OrderItem | 1 : N |
| Order – Payment | 1 : 0..1 (only when `payment_method = online`) |
| Order – Message | 1 : N |
| CustomCake – CustomCakeLayer | 1 : N (1..5) |
| CustomCake – Topping | N : M (via `custom_cake_topping`) |
| CustomCake – Shape | N : 1 |
| CustomCakeLayer – Flavor | N : 1 |
| Cake – Review | 1 : N |

## How to Export the PNG
1. Open this file in VS Code with the Markdown Preview Mermaid Support extension, or
2. Paste the Mermaid block into <https://mermaid.live> and export as PNG to `docs/er-diagram.png`.
