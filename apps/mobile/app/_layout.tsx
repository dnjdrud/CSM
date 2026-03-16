import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { verifyMobileLogin } from '@/lib/api';
import type { Session } from '@supabase/supabase-js';

function AuthGate({ session, loading }: { session: Session | null; loading: boolean }) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(app)/feed');
    }
  }, [session, loading, segments]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep link: cellah://auth/verify?id=X&token=Y
  useEffect(() => {
    async function handleUrl(url: string) {
      const parsed = Linking.parse(url);
      if (parsed.path === 'auth/verify' && parsed.queryParams?.id && parsed.queryParams?.token) {
        const id = String(parsed.queryParams.id);
        const token = String(parsed.queryParams.token);
        const result = await verifyMobileLogin(id, token);
        if (result.access_token && result.refresh_token) {
          await supabase.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          });
        }
      }
    }

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    return () => sub.remove();
  }, []);

  return (
    <>
      <AuthGate session={session} loading={loading} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
