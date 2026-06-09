import { useNavigate } from 'react-router-dom';
import { useCakeSpec, type Shape, type Size, type Frosting } from '../hooks/useCakeSpec';
import { calculateCakePrice } from '../hooks/useCakePrice';
import { FLAVOR_LIST, TOPPING_LIST } from './flavorMaterials';
import { useAuth } from '@/lib/useAuth';
import { useCreateCustomCake } from '@/lib/useCustomCake';
import { useAddToCart } from '@/lib/useCart';

const SHAPES: Shape[] = ['round', 'square', 'heart'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const FROSTINGS: Frosting[] = ['smooth', 'whipped', 'fondant'];

export function SpecForm() {
  const spec = useCakeSpec((s) => s.spec);
  const {
    setShape,
    setSize,
    setLayerCount,
    setLayerFlavor,
    setFrosting,
    toggleTopping,
    setColor,
    setMessage,
  } = useCakeSpec();

  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const createCustomCake = useCreateCustomCake();
  const addToCart = useAddToCart();

  const price = calculateCakePrice(spec);

  const isPending = createCustomCake.isPending || addToCart.isPending;
  const isSuccess = addToCart.isSuccess;
  const error = createCustomCake.error ?? addToCart.error;

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const saved = await createCustomCake.mutateAsync(spec);
      await addToCart.mutateAsync({ customCakeId: saved.id, quantity: 1 });
    } catch {
      // errors surfaced via createCustomCake.error / addToCart.error
    }
  };

  return (
    <form className="space-y-6 p-6 overflow-y-auto">
      <Field label="Shape">
        <div className="flex gap-2">
          {SHAPES.map((s) => (
            <Chip key={s} active={spec.shape === s} onClick={() => setShape(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Size">
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <Chip key={s} active={spec.size === s} onClick={() => setSize(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={`Layers (${spec.layers.length})`}>
        <input
          type="range"
          min={1}
          max={5}
          value={spec.layers.length}
          onChange={(e) => setLayerCount(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Flavor per layer">
        <div className="space-y-2">
          {spec.layers.map((layer, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm w-20">Layer {i + 1}</span>
              <select
                value={layer.flavor}
                onChange={(e) => setLayerFlavor(i, e.target.value)}
                className="flex-1 rounded border px-2 py-1"
              >
                {FLAVOR_LIST.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Field>

      <Field label="Frosting">
        <div className="flex gap-2">
          {FROSTINGS.map((f) => (
            <Chip key={f} active={spec.frosting === f} onClick={() => setFrosting(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Frosting color">
        <input
          type="color"
          value={spec.colorHex}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-20"
        />
      </Field>

      <Field label="Toppings">
        <div className="flex flex-wrap gap-2">
          {TOPPING_LIST.map((t) => (
            <Chip
              key={t}
              active={spec.toppings.includes(t)}
              onClick={() => toggleTopping(t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Message (max 30 chars)">
        <input
          type="text"
          maxLength={30}
          value={spec.messageText}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Happy Birthday!"
          className="w-full rounded border px-2 py-1"
        />
      </Field>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg">
            Estimated total: <strong>${price.toFixed(2)}</strong>
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isPending}
            className={`rounded px-4 py-2 font-medium transition disabled:opacity-60 ${
              isSuccess
                ? 'bg-green-500 text-white'
                : 'bg-cake-500 hover:bg-cake-700 text-white'
            }`}
          >
            {isPending ? 'Saving…' : isSuccess ? 'Added! ✓' : 'Add to cart'}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-500">
            {(error as Error).message ?? 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border ${
        active
          ? 'bg-cake-500 text-white border-cake-500'
          : 'bg-white text-gray-800 border-gray-300 hover:border-cake-500'
      }`}
    >
      {children}
    </button>
  );
}
