import { create } from 'zustand';

export type Shape = 'round' | 'square' | 'heart';
export type Size = 'small' | 'medium' | 'large';
export type Frosting = 'smooth' | 'whipped' | 'fondant';

export interface LayerSpec {
  flavor: string;       // flavor name (matches FLAVOR_MATERIALS keys)
}

export interface CakeSpec {
  shape: Shape;
  size: Size;
  layers: LayerSpec[];
  frosting: Frosting;
  toppings: string[];   // topping names
  colorHex: string;     // frosting tint
  messageText: string;
}

interface CakeSpecStore {
  spec: CakeSpec;
  setShape: (s: Shape) => void;
  setSize: (s: Size) => void;
  setLayerCount: (n: number) => void;          // 1..5 (BR-01)
  setLayerFlavor: (index: number, flavor: string) => void;
  setFrosting: (f: Frosting) => void;
  toggleTopping: (t: string) => void;          // BR-03 no duplicates
  setColor: (hex: string) => void;
  setMessage: (msg: string) => void;
  reset: () => void;
}

const DEFAULT_SPEC: CakeSpec = {
  shape: 'round',
  size: 'medium',
  layers: [{ flavor: 'vanilla' }],
  frosting: 'smooth',
  toppings: [],
  colorHex: '#f7d6b8',
  messageText: '',
};

export const useCakeSpec = create<CakeSpecStore>((set) => ({
  spec: DEFAULT_SPEC,
  setShape: (shape) => set((s) => ({ spec: { ...s.spec, shape } })),
  setSize:  (size)  => set((s) => ({ spec: { ...s.spec, size } })),
  setLayerCount: (n) =>
    set((s) => {
      const clamped = Math.max(1, Math.min(5, n)); // BR-01
      const layers = Array.from({ length: clamped }, (_, i) =>
        s.spec.layers[i] ?? { flavor: 'vanilla' },
      );
      return { spec: { ...s.spec, layers } };
    }),
  setLayerFlavor: (index, flavor) =>
    set((s) => {
      const layers = s.spec.layers.map((l, i) => (i === index ? { ...l, flavor } : l));
      return { spec: { ...s.spec, layers } };
    }),
  setFrosting: (frosting) => set((s) => ({ spec: { ...s.spec, frosting } })),
  toggleTopping: (t) =>
    set((s) => {
      const toppings = s.spec.toppings.includes(t)
        ? s.spec.toppings.filter((x) => x !== t)
        : [...s.spec.toppings, t];
      return { spec: { ...s.spec, toppings } };
    }),
  setColor: (colorHex) => set((s) => ({ spec: { ...s.spec, colorHex } })),
  setMessage: (messageText) =>
    set((s) => ({ spec: { ...s.spec, messageText: messageText.slice(0, 30) } })), // VAL-07
  reset: () => set({ spec: DEFAULT_SPEC }),
}));
