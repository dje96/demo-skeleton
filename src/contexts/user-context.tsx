'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  setUserForTracking,
  clearUserForTracking,
  disableAnonymousMode,
} from '@/lib/snowplow-config';
import { trackLogin, type LoginMethod } from '@/lib/tracking';

interface DemoUser {
  email: string;
  isLoggedIn: boolean;
}

interface UserContextValue {
  user: DemoUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, method?: LoginMethod) => void;
  logout: () => void;
}

const USER_STORAGE_KEY = 'demo-user';

const UserContext = createContext<UserContextValue | undefined>(undefined);

/**
 * Manages demo auth state and mirrors identity into the Snowplow tracker.
 * MUST be rendered inside <SnowplowInit> so the tracker exists before
 * setUserId() is called.
 *
 * The anonymous→known identity stitch (the reusable value here): on login we
 * setUserId + leave anonymous mode BEFORE the login event fires, so the login
 * and everything after is attributed to the now-known user.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore saved user on init. requestAnimationFrame avoids hydration
  // mismatches by deferring the localStorage read past the first paint.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DemoUser;
          if (parsed?.email && parsed.isLoggedIn) {
            setUser(parsed);
            // Returning known visitor: re-assert identity and leave anonymous
            // mode so events are attributed. No fresh login event on rehydrate.
            setUserForTracking(parsed.email);
            disableAnonymousMode();
          }
        }
      } catch {
        // ignore malformed storage
      } finally {
        setIsLoading(false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const login = useCallback((email: string, method: LoginMethod = 'email') => {
    const nextUser: DemoUser = { email, isLoggedIn: true };
    setUser(nextUser);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    // The anonymous → known stitch: set the user id and leave anonymous mode
    // BEFORE the login event fires.
    setUserForTracking(email);
    disableAnonymousMode();
    trackLogin({ login_method: method, login_status: 'success' });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    clearUserForTracking();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user?.isLoggedIn),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
