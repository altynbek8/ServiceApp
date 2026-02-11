import { Icon, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function Index() {
  const { session, isLoading, user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('Инициализация...');
  const [showReset, setShowReset] = useState(false);

  // Таймер спасения: если грузится дольше 3 сек, даем кнопку выхода
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowReset(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      // Плавный переход, чтобы не мигало
      setTimeout(() => router.replace('/onboarding'), 100);
      return;
    }

    checkRole();
  }, [session, isLoading]);

  async function checkRole() {
    if (!user) return;
    setStatus('Синхронизация профиля...');

    try {
      // 1. Быстрая проверка через метаданные
      if (user.user_metadata?.role) {
          navigateByRole(user.user_metadata.role);
          return;
      }

      // 2. Если нет в метаданных — смотрим базу
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile?.role) {
        // Роли нет — идем выбирать
        router.replace('/(auth)/role-select');
      } else {
        // Роль есть — обновляем метаданные и заходим
        await supabase.auth.updateUser({ data: { role: profile.role } });
        navigateByRole(profile.role);
      }
    } catch (e) {
      console.error(e);
      router.replace('/(auth)/role-select');
    }
  }

  function navigateByRole(role: string) {
    if (role === 'client' || role === 'admin') router.replace('/(client)/home');
    else if (role === 'specialist') router.replace('/(specialist)/home');
    else if (role === 'venue') router.replace('/(venue)/home');
    else router.replace('/(auth)/role-select');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0C15', padding: 20 }}>
      <StatusBar style="light" />
      
      {/* Логотип */}
      <Icon name="zap" type="feather" size={80} color="#8A2BE2" />
      
      <View style={{ height: 30 }} />
      
      {/* Индикатор */}
      {isLoading ? (
          <ActivityIndicator size="large" color="#00FFCC" />
      ) : (
          <Icon name="check-circle" type="feather" size={40} color="#00FFCC" />
      )}

      <Text style={{ marginTop: 20, color: '#A09BAF', fontWeight: '600', fontSize: 14, letterSpacing: 1 }}>
        {status.toUpperCase()}
      </Text>

      {/* КНОПКА СПАСЕНИЯ (появляется при зависании) */}
      {showReset && (
        <View style={{ marginTop: 60, width: '100%', alignItems: 'center', opacity: 0.8 }}>
            <Text style={{ color: '#FF4757', marginBottom: 10, fontSize: 12 }}>Долго грузится?</Text>
            <Button 
                title="Сбросить и войти заново" 
                onPress={async () => {
                    await supabase.auth.signOut();
                    router.replace('/onboarding');
                }}
                buttonStyle={{ backgroundColor: 'transparent', borderColor: '#FF4757', borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, height: 45 }}
                titleStyle={{ color: '#FF4757', fontWeight: 'bold', fontSize: 14 }}
            />
        </View>
      )}
    </View>
  );
}