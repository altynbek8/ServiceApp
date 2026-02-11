import { Avatar, Icon, ListItem, Text, useTheme } from '@rneui/themed';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    { title: 'Редактировать информацию', icon: 'edit-2', route: '/(venue)/edit-profile' },
    { title: 'Галерея (Меню/Интерьер)', icon: 'image', route: '/(venue)/portfolio' },
    { title: 'Настройки аккаунта', icon: 'settings', route: '/settings' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Avatar 
          size={120} 
          rounded 
          source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
          icon={!profile?.avatar_url ? { name: 'home', type: 'font-awesome' } : undefined}
          containerStyle={{ backgroundColor: '#ccc', marginBottom: 15, borderWidth: 2, borderColor: theme.colors.primary }}
          imageProps={{ resizeMode: 'cover' }}
        />
        <Text h3 style={{color: theme.colors.black, textAlign: 'center'}}>{profile?.full_name || 'Заведение'}</Text>
      </View>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} onPress={() => router.push(item.route as any)}>
            <ListItem containerStyle={[styles.listItem, { backgroundColor: theme.colors.grey0 }]}>
              <Icon name={item.icon} type="feather" color="#2089dc" />
              <ListItem.Content><ListItem.Title style={{fontWeight: 'bold', color: theme.colors.black}}>{item.title}</ListItem.Title></ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, paddingTop: 60 }, header: { alignItems: 'center', marginBottom: 40, paddingHorizontal: 20 }, menuContainer: { paddingHorizontal: 20 }, listItem: { borderRadius: 15, marginBottom: 10 } });