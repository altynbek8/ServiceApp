import { Text, useTheme } from '@rneui/themed';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { ProfileCard } from '../../components/ProfileCard'; // <--- Новая карточка
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchFavorites(); }, []));

  async function fetchFavorites() {
    if (!user) return;
    const { data: favData } = await supabase.from('favorites').select('target_id').eq('user_id', user.id);
    const favoriteIds = favData?.map(f => f.target_id) || [];

    if (favoriteIds.length > 0) {
      // Ищем и в спецах, и в заведениях (через View глобального поиска, если есть, или специалиста)
      // Для простоты используем specialist_search_view, но в идеале global
      const { data } = await supabase.from('specialist_search_view').select('*').in('id', favoriteIds); 
      if (data) setItems(data);
    } else {
      setItems([]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader title="Избранное" showBack={false} />
      
      {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
          <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProfileCard item={item} />} // <--- Используем ProfileCard
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchFavorites();}} tintColor={theme.colors.primary} />}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={
                  <View style={styles.empty}>
                      <Text style={{ fontSize: 40 }}>💔</Text>
                      <Text style={[styles.emptyText, { color: theme.colors.grey2 }]}>Вы пока никого не сохранили</Text>
                  </View>
              }
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, fontSize: 16, fontWeight: '500' }
});