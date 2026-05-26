'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterDto } from '@brandflow/shared';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuthResponse } from '@brandflow/shared';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterDto) => {
    try {
      const res = await apiClient.post<AuthResponse>('/auth/register', data);
      const { user, tokens, business } = res.data;

      setAuth(
        { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, mfaEnabled: user.mfaEnabled },
        tokens.accessToken,
        { id: business.id, name: business.name, slug: business.slug },
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage ?? 'Registration failed. Please try again.';
      setError('root', { message });
    }
  };

  return (
    <div className="bg-background rounded-2xl shadow-lg p-8 space-y-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">BrandFlow</div>
        <h1 className="text-xl font-bold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start your free 14-day trial</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">First name</label>
            <input
              type="text"
              {...register('firstName')}
              autoComplete="given-name"
              className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Last name</label>
            <input
              type="text"
              {...register('lastName')}
              autoComplete="family-name"
              className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Business name</label>
          <input
            type="text"
            {...register('businessName')}
            autoComplete="organization"
            className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Acme Inc."
          />
          {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            autoComplete="email"
            className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Min. 8 chars with uppercase, number &amp; special character</p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-400">{errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-primary hover:bg-brand-700 text-foreground font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account…' : 'Get started — free'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}
