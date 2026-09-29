import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth, loginWithRedirect } from 'zitejs/auth';
import { me, type MeOutputType } from 'zitejs/api';
import LoginPrompt from '../components/LoginPrompt';

type Profile = NonNullable<MeOutputType['profile']>;

type SessionValue = {
  isLoading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  /** Returns true when signed in; otherwise opens the sign-in invitation. */
  requireAuth: (reason?: string) => boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    setLoadingProfile(true);
    try {
      const res = await me({ section: 'session' });
      setProfile(res.profile ?? null);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const requireAuth = useCallback((reason?: string) => {
    if (user) return true;
    setPrompt(reason ?? 'Connectez-vous pour continuer.');
    return false;
  }, [user]);

  return (
    <SessionContext.Provider
      value={{
        isLoading: authLoading || loadingProfile,
        profile: user ? profile : null,
        isAdmin: !!user && profile?.role === 'admin',
        requireAuth,
        refresh,
      }}
    >
      {children}
      <LoginPrompt
        open={prompt !== null}
        reason={prompt ?? ''}
        onClose={() => setPrompt(null)}
        onLogin={() => loginWithRedirect()}
      />
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
