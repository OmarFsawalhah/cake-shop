import type { CakeSpec, Size } from './useCakeSpec';

/**
 * Client-side mirror of BR-04. Server is authoritative — see
 * apps/api/src/custom-cakes/pricing.ts.
 */
const SIZE_FACTOR: Record<Size, number> = {
  small: 1.0,
  medium: 1.5,
  large: 2.2,
};

const SHAPE_PRICE_MODIFIER: Record<string, number> = {
  round: 15,
  square: 16,
  heart: 20,
};

const FLAVOR_PRICE_MODIFIER: Record<string, number> = {
  vanilla: 2,
  chocolate: 3,
  strawberry: 3,
  'red-velvet': 4,
  lemon: 3,
  coffee: 3.5,
};

const TOPPING_PRICE: Record<string, number> = {
  sprinkles: 1,
  'chocolate-chips': 1.5,
  berries: 2.5,
  'gold-flakes': 5,
  caramel: 2,
};

export function calculateCakePrice(spec: CakeSpec): number {
  const shape = SHAPE_PRICE_MODIFIER[spec.shape] ?? 0;
  const layersCost = spec.layers.reduce(
    (sum, l) => sum + (FLAVOR_PRICE_MODIFIER[l.flavor] ?? 0),
    0,
  );
  const toppingsCost = spec.toppings.reduce(
    (sum, t) => sum + (TOPPING_PRICE[t] ?? 0),
    0,
  );
  const sizeFactor = SIZE_FACTOR[spec.size];
  return Number(
    (shape + sizeFactor * spec.layers.length + layersCost + toppingsCost).toFixed(2),
  );
}
