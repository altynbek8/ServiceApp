import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '../lib/push';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, isAuthenticated: false, isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          if (session?.user) registerForPushNotificationsAsync(session.user.id);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        // САМОЕ ВАЖНОЕ: Отключаем загрузку в любом случае!
        if (mounted) setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        // Также гарантируем, что загрузка выключена при смене статуса
        setIsLoading(false); 
        if (_event === 'SIGNED_IN' && session?.user) registerForPushNotificationsAsync(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isAuthenticated: !!session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}