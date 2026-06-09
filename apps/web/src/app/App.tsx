import { useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { CustomCakePage } from '@/features/custom-cake/CustomCakePage';
import { CartPage } from '@/features/cart/CartPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AdminOrdersPage } from '@/features/admin/AdminOrdersPage';
import { useAuth } from '@/lib/useAuth';
import { useCartItemCount } from '@/lib/useCart';

export default function App() {
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  // Handle 401 responses from api.ts by clearing auth and redirecting to /login
  useEffect(() => {
    const handler = () => {
      logout();
      navigate('/login');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/custom-cake" element={<CustomCakePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function Header() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const itemCount = useCartItemCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-cake-700 flex items-center gap-2">
          🎂 Cake Shop
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5 text-sm">
          <Link
            to="/catalog"
            className="text-gray-600 hover:text-cake-700 transition"
          >
            Catalog
          </Link>
          <Link
            to="/custom-cake"
            className="text-gray-600 hover:text-cake-700 transition"
          >
            Build Your Own
          </Link>

          {/* Cart with badge */}
          <Link
            to="/cart"
            className="relative text-gray-600 hover:text-cake-700 transition"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2.5 -right-3.5 bg-cake-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* Auth section */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs hidden sm:block">
                Hi,{' '}
                <strong className="text-gray-700">
                  {user.name ?? user.userId.slice(0, 8) + '…'}
                </strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-cake-500 text-white text-sm px-4 py-1.5 rounded-full hover:bg-cake-700 transition font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function NotFound() {
  return (
    <div className="text-center p-16">
      <p className="text-4xl mb-4">🍰</p>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <Link to="/catalog" className="text-cake-500 underline">
        Back to catalog
      </Link>
    </div>
  );
}
