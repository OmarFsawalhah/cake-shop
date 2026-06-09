import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import {
  useCartQuery,
  useUpdateQty,
  useRemoveItem,
  useClearCart,
  type CartItem,
} from '@/lib/useCart';

export function CartPage() {
  const user = useAuth((s) => s.user);
  const { data: cart, isLoading } = useCartQuery();
  const updateQty = useUpdateQty();
  const removeItem = useRemoveItem();
  const clearCart = useClearCart();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <section className="max-w-md mx-auto p-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold mb-2">Your cart is waiting</h2>
        <p className="text-gray-500 mb-6">
          Log in to add cakes and see your cart.
        </p>
        <Link
          to="/login"
          className="bg-cake-500 text-white px-6 py-2.5 rounded-full hover:bg-cake-700 font-medium"
        >
          Login
        </Link>
      </section>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) return <CartSkeleton />;

  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <section className="max-w-md mx-auto p-12 text-center">
        <div className="text-6xl mb-4">🎂</div>
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">
          Browse our catalog or build a custom cake.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/catalog"
            className="bg-cake-500 text-white px-5 py-2 rounded-full hover:bg-cake-700 text-sm font-medium"
          >
            Browse Catalog
          </Link>
          <Link
            to="/custom-cake"
            className="border border-cake-500 text-cake-700 px-5 py-2 rounded-full hover:bg-cake-50 text-sm font-medium"
          >
            Build Your Own
          </Link>
        </div>
      </section>
    );
  }

  // ── Populated cart ─────────────────────────────────────────────────────────
  return (
    <section className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <button
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
          className="text-sm text-red-400 hover:text-red-600 hover:underline disabled:opacity-50"
        >
          {clearCart.isPending ? 'Clearing…' : 'Clear cart'}
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            onUpdateQty={(q) => updateQty.mutate({ id: item.id, quantity: q })}
            onRemove={() => removeItem.mutate(item.id)}
            isUpdating={updateQty.isPending || removeItem.isPending}
          />
        ))}
      </ul>

      {/* Summary */}
      <div className="mt-6 border-t pt-5 bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg text-gray-600">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
          <span className="text-2xl font-bold text-cake-700">
            ${total.toFixed(2)}
          </span>
        </div>
        <button
          className="w-full bg-cake-500 hover:bg-cake-700 text-white font-semibold py-3 rounded-xl transition"
          onClick={() => alert('Checkout coming in Sprint 4!')}
        >
          Proceed to Checkout →
        </button>
        <Link
          to="/catalog"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-3"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

// ─── Cart row ──────────────────────────────────────────────────────────────────

function CartRow({
  item,
  onUpdateQty,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  onUpdateQty: (q: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  const name = item.cake?.name ?? 'Custom Cake';
  const image = item.cake?.imageUrl ?? null;
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <li className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
      {/* Thumbnail */}
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 bg-cake-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          🎂
        </div>
      )}

      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{name}</p>
        <p className="text-sm text-gray-400">${item.unitPrice.toFixed(2)} each</p>
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg leading-none disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-7 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg leading-none disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <p className="w-20 text-right font-semibold">${lineTotal.toFixed(2)}</p>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={isUpdating}
        className="text-gray-300 hover:text-red-400 text-2xl leading-none ml-1 disabled:opacity-40"
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </li>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <section className="max-w-3xl mx-auto p-8 space-y-3">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </section>
  );
}
