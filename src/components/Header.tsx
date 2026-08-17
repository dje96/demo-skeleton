'use client';

import { useState } from 'react';
import Link from 'next/link';

import { siteConfig } from '@/lib/config';
import { useUser } from '@/contexts/user-context';

/**
 * PLACEHOLDER header. Kept minimal on purpose — its only real job in the
 * skeleton is to demonstrate the anonymous→known identity stitch (see
 * user-context.tsx): signing in calls `login(email)`, which sets the user_id,
 * leaves anonymous mode, and fires the login event, in that order.
 *
 * Replace with the demo's real nav / branding / sign-in modal.
 */
export default function Header() {
  const { isLoggedIn, user, login, logout } = useUser();
  const [email, setEmail] = useState('');

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-heading text-h4 font-bold text-heading">
          {siteConfig.brand.name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {siteConfig.navigation.mainMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-nav text-body transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isLoggedIn ? (
          <div className="flex items-center gap-3 text-small">
            <span className="text-muted">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-border px-4 py-1.5 font-semibold text-heading transition-colors hover:bg-surface-raised"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) login(email.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-small text-heading placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-1.5 text-small font-bold text-inverse transition-colors hover:bg-highlight"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
