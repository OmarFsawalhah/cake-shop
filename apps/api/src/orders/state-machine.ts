/**
 * Order state machine — BR-06, BR-07, BR-08, BR-14.
 * See docs/requirements.md §5.
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'baking'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type Actor = 'customer' | 'admin' | 'system';

const ALLOWED: Record<OrderStatus, Partial<Record<Actor, OrderStatus[]>>> = {
  pending: {
    admin: ['confirmed', 'cancelled'],
    customer: ['cancelled'],
  },
  confirmed: { admin: ['baking', 'cancelled'] },
  baking: { admin: ['ready', 'cancelled'] },
  ready: { admin: ['out_for_delivery'] },
  out_for_delivery: { admin: ['delivered'] },
  delivered: {}, // terminal
  cancelled: { system: ['refunded'] }, // BR-14 (online-paid)
  refunded: {},
};

export class InvalidStateTransitionError extends Error {}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
): boolean {
  return (ALLOWED[from]?.[actor] ?? []).includes(to);
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
): void {
  if (!canTransition(from, to, actor)) {
    throw new InvalidStateTransitionError(
      `${actor} cannot move order from ${from} to ${to}`,
    );
  }
}
