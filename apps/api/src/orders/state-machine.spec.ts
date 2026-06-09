import { canTransition, assertTransition } from './state-machine';

describe('order state machine', () => {
  it('BR-07: admin can confirm a pending order', () => {
    expect(canTransition('pending', 'confirmed', 'admin')).toBe(true);
  });

  it('BR-08: customer can cancel only when pending', () => {
    expect(canTransition('pending', 'cancelled', 'customer')).toBe(true);
    expect(canTransition('confirmed', 'cancelled', 'customer')).toBe(false);
    expect(canTransition('baking', 'cancelled', 'customer')).toBe(false);
  });

  it('BR-06: delivered is terminal', () => {
    expect(canTransition('delivered', 'cancelled', 'admin')).toBe(false);
    expect(canTransition('delivered', 'refunded', 'admin')).toBe(false);
  });

  it('throws on invalid transition', () => {
    expect(() => assertTransition('delivered', 'pending', 'admin')).toThrow();
  });
});
