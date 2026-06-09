/**
 * Authoritative custom-cake pricing — BR-04 in docs/rules.md.
 * Mirrored client-side in apps/web/src/features/custom-cake/hooks/useCakePrice.ts
 * but the value persisted on `CustomCake.computedPrice` MUST come from here.
 */

const SIZE_FACTOR: Record<string, number> = {
  small: 1.0,
  medium: 1.5,
  large: 2.2,
};

export interface PricingInput {
  shape: { priceModifier: number };
  size: 'small' | 'medium' | 'large';
  layers: { flavor: { priceModifier: number } }[];
  toppings: { price: number }[];
}

export function calculateCustomCakePrice(spec: PricingInput): number {
  if (spec.layers.length < 1 || spec.layers.length > 5) {
    throw new Error('BR-01: layers must be between 1 and 5');
  }
  const shape = Number(spec.shape.priceModifier);
  const sizeFactor = SIZE_FACTOR[spec.size];
  if (sizeFactor === undefined) throw new Error(`Unknown size: ${spec.size}`);
  const layersCost = spec.layers.reduce(
    (sum, l) => sum + Number(l.flavor.priceModifier),
    0,
  );
  const toppingsCost = spec.toppings.reduce(
    (sum, t) => sum + Number(t.price),
    0,
  );
  return Number(
    (shape + sizeFactor * spec.layers.length + layersCost + toppingsCost).toFixed(2),
  );
}
