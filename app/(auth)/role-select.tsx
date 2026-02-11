import { Icon, Text, useTheme } from '@rneui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function RoleSelectScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { city } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);

  // ИСПРАВЛЕННАЯ ЛОГИКА СОХРАНЕНИЯ
  async function handleSelectRole(role: 'client' | 'specialist' | 'venue') {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Обновляем основную таблицу
      const userCity = city || user.user_metadata?.city || null;
      const { error } = await supabase
        .from('profiles')
        .update({ 
            role: role,
            city: userCity // Используем надежное значение
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Создаем профиль в под-таблицах (ВАЖНО!)
      if (role === 'specialist') {
          await supabase.from('specialist_profiles').upsert({ id: user.id });
      } else if (role === 'venue') {
          await supabase.from('venue_profiles').upsert({ id: user.id });
      }

      // 3. Обновляем локальную сессию
      await supabase.auth.updateUser({ data: { role: role } });

      // 4. Редирект
      if (role === 'client') router.replace('/(client)/home');
      else if (role === 'specialist') router.replace('/(specialist)/home');
      else if (role === 'venue') router.replace('/(venue)/home');

    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
      setLoading(false);
    }
  }

  // Компонент Карточки
  const RoleCard = ({ role, title, desc, icon, color }: any) => (
    <TouchableOpacity 
      style={[styles.card, { borderColor: color + '40', shadowColor: color }]} 
      activeOpacity={0.8}
      onPress={() => handleSelectRole(role)}
      disabled={loading}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Icon name={icon} type="feather" size={32} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: '#fff' }]}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <Icon name="chevron-right" type="feather" color="#6B6675" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, backgroundColor: theme.colors.background }]}>
      
      <View style={styles.header}>
        <Text h2 style={{ color: '#fff', fontWeight: '900', textAlign: 'center', marginBottom: 10 }}>Кто вы?</Text>
        <Text style={{ color: '#A09BAF', textAlign: 'center', fontSize: 16 }}>
            Выберите режим использования
        </Text>
      </View>

      {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#8A2BE2" />
              <Text style={{ color: '#fff', marginTop: 20, fontWeight: '600' }}>Настройка аккаунта...</Text>
          </View>
      ) : (
          <View style={styles.content}>
            <RoleCard 
                role="client" 
                title="Я Клиент" 
                desc="Ищу услуги, мастеров или заведения." 
                icon="search" 
                color="#00FFCC" 
            />
            
            <RoleCard 
                role="specialist" 
                title="Я Мастер" 
                desc="Принимаю заказы, веду график." 
                icon="briefcase" 
                color="#8A2BE2" 
            />
            
            <RoleCard 
                role="venue" 
                title="Я Заведение" 
                desc="Владелец салона, барбершопа или ресторана." 
                icon="map-pin" 
                color="#FF4757" 
            />
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 40 },
  content: { gap: 20 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1625',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    // Неоновое свечение
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  iconBox: {
      width: 60, height: 60,
      borderRadius: 18,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 20
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { color: '#A09BAF', fontSize: 13, lineHeight: 18 }
});