// Knowledge-base mapping VR-03: flavor → material.
// See docs/rules.md §3.

export interface FlavorMaterial {
  color: string;
  roughness: number;
}

export const FLAVOR_MATERIALS: Record<string, FlavorMaterial> = {
  vanilla:      { color: '#f3e5ab', roughness: 0.5  },
  chocolate:    { color: '#3b2412', roughness: 0.6  },
  strawberry:   { color: '#f7a8b8', roughness: 0.5  },
  'red-velvet': { color: '#a02334', roughness: 0.55 },
  lemon:        { color: '#fff066', roughness: 0.45 },
  coffee:       { color: '#6f4e37', roughness: 0.55 },
};

export const FLAVOR_LIST = Object.keys(FLAVOR_MATERIALS);

export const TOPPING_LIST = [
  'sprinkles',
  'chocolate-chips',
  'berries',
  'gold-flakes',
  'caramel',
];

export const TOPPING_COLORS: Record<string, string> = {
  sprinkles: '#ff5fa2',
  'chocolate-chips': '#2e1a0d',
  berries: '#a02334',
  'gold-flakes': '#f7c948',
  caramel: '#b06a2a',
};
