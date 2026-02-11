import { Icon, Text, useTheme } from '@rneui/themed';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { UserAvatar } from '../../components/UserAvatar'; // <---
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function VenueProfileMenu() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      if(user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({data}) => setProfile(data));
    }, [user])
  );

  const menuItems = [
    { title: 'Редактировать профиль', icon: 'edit-2', route: '/(venue)/edit-profile', color: theme.colors.primary },
    { title: 'Галерея (Интерьер/Меню)', icon: 'image', route: '/(venue)/portfolio', color: '#F59E0B' },
    { title: 'Настройки аккаунта', icon: 'settings', route: '/settings', color: theme.colors.grey2 },
  ];

  const MenuItem = ({ item }: any) => (
    <TouchableOpacity 
      onPress={() => router.push(item.route)}
      activeOpacity={0.7}
      style={[styles.menuItem, { backgroundColor: theme.colors.grey0 }]}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
        <Icon name={item.icon} type="feather" color={item.color} size={20} />
      </View>
      <Text style={[styles.menuTitle, { color: theme.colors.black }]}>{item.title}</Text>
      <Icon name="chevron-right" type="feather" color={theme.colors.grey3} size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <UserAvatar avatarUrl={profile?.avatar_url} size={120} />
        
        <Text h3 style={{ color: theme.colors.black, textAlign: 'center', marginTop: 15, fontWeight: '900' }}>
            {profile?.full_name || 'Заведение'}
        </Text>
        <Text style={{ color: theme.colors.grey2, marginTop: 5 }}>
            {profile?.city || 'Адрес не указан'}
        </Text>

        <View style={[styles.tag, { backgroundColor: theme.colors.primary + '15', marginTop: 15 }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 }}>
                Бизнес аккаунт
            </Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    
    menuContainer: { paddingHorizontal: 20, gap: 12 },
    menuItem: { 
        flexDirection: 'row', alignItems: 'center', 
        padding: 16, borderRadius: 18, 
    },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTitle: { flex: 1, fontSize: 16, fontWeight: '600' }
});