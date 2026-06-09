import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartCake {
  id: string;
  name: string;
  imageUrl: string;
  basePrice: number;
}

export interface CartCustomCake {
  id: string;
  computedPrice: number;
}

export interface CartItem {
  id: string;
  cakeId: string | null;
  customCakeId: string | null;
  quantity: number;
  unitPrice: number;
  cake: CartCake | null;
  customCake: CartCustomCake | null;
}

export interface Cart {
  id?: string;
  userId: string;
  items: CartItem[];
}

// ─── Query key ────────────────────────────────────────────────────────────────

const CART_KEY = ['cart'] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetches the cart only when the user is logged in. */
export function useCartQuery() {
  const user = useAuth((s) => s.user);
  return useQuery<Cart>({
    queryKey: CART_KEY,
    queryFn: () => api<Cart>('/cart'),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

/** Adds a pre-made cake or custom cake to the cart. */
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      cakeId?: string;
      customCakeId?: string;
      quantity: number;
    }) =>
      api<CartItem>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  });
}

/** Updates the quantity of an existing cart item. quantity=0 removes the item. */
export function useUpdateQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api<CartItem | void>(`/cart/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  });
}

/** Removes a single item from the cart. */
export function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/cart/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  });
}

/** Removes all items from the cart. */
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/cart', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  });
}

/** Convenience: total item count for badge display. */
export function useCartItemCount(): number {
  const { data } = useCartQuery();
  return data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}
