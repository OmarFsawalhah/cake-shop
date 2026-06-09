import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';

type Tab = 'login' | 'register';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-cake-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-cake-700 mb-6 text-center">
          🎂 Welcome
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-sm font-medium capitalize transition ${
                tab === t
                  ? 'border-b-2 border-cake-500 text-cake-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'login' ? 'Login' : 'Create Account'}
            </button>
          ))}
        </div>

        {tab === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </section>
  );
}

// ─── Login form ────────────────────────────────────────────────────────────────

type LoginFields = { email: string; password: string };

function LoginForm() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>();

  const onSubmit = async ({ email, password }: LoginFields) => {
    setApiError('');
    try {
      await login(email, password);
      navigate('/catalog');
    } catch (e: any) {
      setApiError(extractMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message}>
        <input
          type="email"
          placeholder="you@example.com"
          className={inputCls}
          {...register('email', { required: 'Email is required' })}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input
          type="password"
          className={inputCls}
          {...register('password', { required: 'Password is required' })}
        />
      </Field>

      {apiError && <ApiError message={apiError} />}

      <SubmitButton loading={isSubmitting} label="Login" />
    </form>
  );
}

// ─── Register form ─────────────────────────────────────────────────────────────

type RegisterFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

function RegisterForm() {
  const navigate = useNavigate();
  const register_ = useAuth((s) => s.register);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>();

  const onSubmit = async (data: RegisterFields) => {
    setApiError('');
    try {
      await register_(data);
      navigate('/catalog');
    } catch (e: any) {
      setApiError(extractMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Full name" error={errors.name?.message}>
        <input
          type="text"
          className={inputCls}
          {...register('name', { required: 'Name is required' })}
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input
          type="email"
          placeholder="you@example.com"
          className={inputCls}
          {...register('email', { required: 'Email is required' })}
        />
      </Field>

      <Field
        label="Phone"
        hint="International format, e.g. +12125551234"
        error={errors.phone?.message}
      >
        <input
          type="tel"
          placeholder="+12125551234"
          className={inputCls}
          {...register('phone', {
            required: 'Phone is required',
            pattern: {
              value: /^\+[1-9]\d{6,14}$/,
              message: 'Use international format: +12125551234',
            },
          })}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input
          type="password"
          className={inputCls}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Minimum 8 characters' },
            pattern: {
              value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/,
              message: 'Must contain uppercase, lowercase, and a digit',
            },
          })}
        />
      </Field>

      {apiError && <ApiError message={apiError} />}

      <SubmitButton loading={isSubmitting} label="Create Account" />
    </form>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cake-500 focus:border-transparent';

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  // Try to surface the human-readable portion of API error strings
  const clean = message.replace(/^API \d+: /, '').slice(0, 200);
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
      {clean}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-cake-500 hover:bg-cake-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Please wait…' : label}
    </button>
  );
}

function extractMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
