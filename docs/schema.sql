-- Cake Shop — Raw DDL (PostgreSQL)
-- For documentation. Prisma migrations are the source of truth.

CREATE TYPE role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'baking', 'ready',
  'out_for_delivery', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE payment_method AS ENUM ('cash', 'online');
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE sender_role AS ENUM ('customer', 'admin');

CREATE TABLE "user" (
  user_id        TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  phone          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  role           role NOT NULL DEFAULT 'customer',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE address (
  address_id  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  street      TEXT NOT NULL,
  city        TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cake (
  cake_id     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  base_price  NUMERIC(10,2) NOT NULL,
  image_url   TEXT NOT NULL,
  category    TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE shape (
  shape_id        TEXT PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  price_modifier  NUMERIC(10,2) NOT NULL,
  model_asset_url TEXT NOT NULL
);

CREATE TABLE flavor (
  flavor_id      TEXT PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE,
  price_modifier NUMERIC(10,2) NOT NULL,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE topping (
  topping_id   TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  price        NUMERIC(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE custom_cake (
  custom_cake_id  TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  shape_id        TEXT NOT NULL REFERENCES shape(shape_id),
  size            TEXT NOT NULL,
  layer_count     INT NOT NULL CHECK (layer_count BETWEEN 1 AND 5),
  frosting        TEXT NOT NULL,
  message_text    TEXT,
  color_hex       TEXT NOT NULL,
  computed_price  NUMERIC(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_cake_layer (
  layer_id       TEXT PRIMARY KEY,
  custom_cake_id TEXT NOT NULL REFERENCES custom_cake(custom_cake_id) ON DELETE CASCADE,
  layer_order    INT NOT NULL,
  flavor_id      TEXT NOT NULL REFERENCES flavor(flavor_id),
  UNIQUE (custom_cake_id, layer_order)
);

CREATE TABLE custom_cake_topping (
  custom_cake_id TEXT NOT NULL REFERENCES custom_cake(custom_cake_id) ON DELETE CASCADE,
  topping_id     TEXT NOT NULL REFERENCES topping(topping_id),
  PRIMARY KEY (custom_cake_id, topping_id)
);

CREATE TABLE cart (
  cart_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TABLE cart_item (
  cart_item_id   TEXT PRIMARY KEY,
  cart_id        TEXT NOT NULL REFERENCES cart(cart_id) ON DELETE CASCADE,
  cake_id        TEXT REFERENCES cake(cake_id),
  custom_cake_id TEXT REFERENCES custom_cake(custom_cake_id),
  quantity       INT NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL,
  CONSTRAINT cart_item_xor CHECK (
    ((cake_id IS NOT NULL)::int + (custom_cake_id IS NOT NULL)::int) = 1
  )
);

CREATE TABLE "order" (
  order_id        TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES "user"(user_id),
  address_id      TEXT NOT NULL REFERENCES address(address_id),
  total_amount    NUMERIC(10,2) NOT NULL,
  status          order_status NOT NULL DEFAULT 'pending',
  payment_method  payment_method NOT NULL,
  payment_status  payment_status NOT NULL DEFAULT 'unpaid',
  delivery_date   TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_item (
  order_item_id  TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL REFERENCES "order"(order_id) ON DELETE CASCADE,
  cake_id        TEXT REFERENCES cake(cake_id),
  custom_cake_id TEXT REFERENCES custom_cake(custom_cake_id),
  quantity       INT NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL,
  CONSTRAINT order_item_xor CHECK (
    ((cake_id IS NOT NULL)::int + (custom_cake_id IS NOT NULL)::int) = 1
  )
);

CREATE TABLE payment (
  payment_id     TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL UNIQUE REFERENCES "order"(order_id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  status         payment_status NOT NULL,
  paid_at        TIMESTAMPTZ
);

CREATE TABLE review (
  review_id  TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  cake_id    TEXT NOT NULL REFERENCES cake(cake_id),
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE message (
  message_id  TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES "order"(order_id) ON DELETE CASCADE,
  sender_role sender_role NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_user      ON "order"(user_id);
CREATE INDEX idx_order_status    ON "order"(status);
CREATE INDEX idx_cart_item_cart  ON cart_item(cart_id);
CREATE INDEX idx_order_item_ord  ON order_item(order_id);
CREATE INDEX idx_review_cake     ON review(cake_id);
CREATE INDEX idx_message_order   ON message(order_id);
