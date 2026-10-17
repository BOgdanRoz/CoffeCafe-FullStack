import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';

// UI state only. Route guards and data access are enforced by Supabase Auth and RLS.
export type OwnerSessionStatus = 'unconfigured' | 'loading' | 'signed-out' | 'forbidden' | 'owner';

type OwnerCheck = { userId: string; isOwner: boolean; failed: boolean };

export function useOwnerSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [ownerCheck, setOwnerCheck] = useState<OwnerCheck | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setSessionReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase || !userId) {
      return;
    }

    let active = true;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) {
          setOwnerCheck({ userId, isOwner: data?.role === 'owner', failed: Boolean(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) {
      return 'Сервер не налаштовано.';
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Same message for wrong email and wrong password, so the form does not reveal accounts.
    return error ? 'Невірний email або пароль.' : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  let status: OwnerSessionStatus;
  if (!supabase) {
    status = 'unconfigured';
  } else if (!sessionReady) {
    status = 'loading';
  } else if (!session) {
    status = 'signed-out';
  } else if (!ownerCheck || ownerCheck.userId !== userId) {
    status = 'loading';
  } else if (ownerCheck.failed) {
    status = 'forbidden';
  } else {
    status = ownerCheck.isOwner ? 'owner' : 'forbidden';
  }

  return { status, email: session?.user.email ?? null, signIn, signOut };
}
