import { calculateCustomCakePrice } from './pricing';

describe('calculateCustomCakePrice (BR-04)', () => {
  const baseSpec = {
    shape: { priceModifier: 15 },
    size: 'medium' as const,
    layers: [{ flavor: { priceModifier: 2 } }],
    toppings: [],
  };

  it('computes price for the simplest cake', () => {
    // 15 + 1.5 * 1 + 2 + 0 = 18.5
    expect(calculateCustomCakePrice(baseSpec)).toBe(18.5);
  });

  it('scales with layers and toppings', () => {
    const spec = {
      ...baseSpec,
      layers: [
        { flavor: { priceModifier: 2 } },
        { flavor: { priceModifier: 3 } },
        { flavor: { priceModifier: 3 } },
      ],
      toppings: [{ price: 1.5 }, { price: 2.5 }],
    };
    // 15 + 1.5*3 + (2+3+3) + (1.5+2.5) = 15 + 4.5 + 8 + 4 = 31.5
    expect(calculateCustomCakePrice(spec)).toBe(31.5);
  });

  it('BR-01: rejects 0 layers', () => {
    expect(() =>
      calculateCustomCakePrice({ ...baseSpec, layers: [] }),
    ).toThrow(/BR-01/);
  });

  it('BR-01: rejects 6 layers', () => {
    expect(() =>
      calculateCustomCakePrice({
        ...baseSpec,
        layers: Array(6).fill({ flavor: { priceModifier: 1 } }),
      }),
    ).toThrow(/BR-01/);
  });
});
