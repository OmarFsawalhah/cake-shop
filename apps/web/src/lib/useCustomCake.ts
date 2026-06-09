import { useMutation } from '@tanstack/react-query';
import { api } from './api';
import type { CakeSpec } from '@/features/custom-cake/hooks/useCakeSpec';

export interface SavedCustomCake {
  id: string;
  computedPrice: number;
}

/** Saves the current cake spec to the backend and returns the new CustomCake id + price. */
export function useCreateCustomCake() {
  return useMutation({
    mutationFn: (spec: CakeSpec) =>
      api<SavedCustomCake>('/custom-cakes', {
        method: 'POST',
        body: JSON.stringify({
          shape: spec.shape,
          size: spec.size,
          layers: spec.layers.map((l) => ({ flavor: l.flavor })),
          frosting: spec.frosting,
          colorHex: spec.colorHex,
          toppings: spec.toppings,
          messageText: spec.messageText || undefined,
        }),
      }),
  });
}
