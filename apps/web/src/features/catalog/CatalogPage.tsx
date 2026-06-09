import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useAddToCart } from '@/lib/useCart';

interface Cake {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  category: string;
}

export function CatalogPage() {
  const { data: cakes, isLoading, error } = useQuery<Cake[]>({
    queryKey: ['cakes'],
    queryFn: () => api<Cake[]>('/cakes'),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox />;

  return (
    <section className="max-w-6xl mx-auto p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-2">Our Cakes</h1>
      <p className="text-gray-500 mb-8">
        Pick a ready-made creation, or{' '}
        <a href="/custom-cake" className="text-cake-500 underline hover:text-cake-700">
          build your own
        </a>
        .
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cakes?.map((cake) => <CakeCard key={cake.id} cake={cake} />)}
      </div>
    </section>
  );
}

function CakeCard({ cake }: { cake: Cake }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const addToCart = useAddToCart();

  const handleAdd = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart.mutate({ cakeId: cake.id, quantity: 1 });
  };

  const btnLabel = addToCart.isPending
    ? 'Adding…'
    : addToCart.isSuccess
    ? 'Added! ✓'
    : 'Add to cart';

  const btnClass = addToCart.isSuccess
    ? 'bg-green-500 text-white'
    : 'bg-cake-500 hover:bg-cake-700 text-white';

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden flex flex-col">
      <img
        src={cake.imageUrl}
        alt={cake.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-cake-500 uppercase tracking-wide">
          {cake.category}
        </span>
        <h2 className="text-lg font-bold mt-1">{cake.name}</h2>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
          {cake.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-cake-700">
            ${Number(cake.basePrice).toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            disabled={addToCart.isPending}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${btnClass}`}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow h-72 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBox() {
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
      <p className="text-red-600 font-medium">Could not load cakes.</p>
      <p className="text-sm text-gray-500 mt-1">
        Make sure the API is running on port 3000.
      </p>
    </div>
  );
}
