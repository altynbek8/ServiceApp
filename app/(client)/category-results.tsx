import { Icon, Text, useTheme } from '@rneui/themed';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { ProfileCard } from '../../components/ProfileCard';
import { supabase } from '../../lib/supabase';

export default function CategoryResultsScreen() {
  const { id, name, type } = useLocalSearchParams();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Принудительно превращаем ID в число
  const categoryId = Number(id);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]); 
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
      console.log(`🔍 ОТКРЫТА КАТЕГОРИЯ: ${name} (ID: ${categoryId}, Type: ${type})`);
      if (isNaN(categoryId)) {
          console.error("❌ ОШИБКА: ID категории не число!");
          return;
      }
      fetchTags();
  }, [categoryId]);

  useEffect(() => { 
      if (!isNaN(categoryId)) fetchItems(); 
  }, [categoryId, selectedTags, sortBy]);

  async function fetchTags() {
      if (type !== 'specialist') return;
      const { data } = await supabase.from('subcategories').select('*').eq('category_id', categoryId);
      if (data) setSubcategories(data);
  }

  async function fetchItems() {
    setLoading(true);
    try {
        if (type === 'specialist') {
            console.log(`📡 Запрос специалистов для категории ID=${categoryId}...`);

            // 1. Фильтр по тегам (если есть)
            let validSpecialistIds: string[] | null = null;
            if (selectedTags.length > 0) {
                const { data: tagMatches } = await supabase
                    .from('specialist_subcategories')
                    .select('specialist_id')
                    .in('subcategory_id', selectedTags);
                
                if (tagMatches) validSpecialistIds = [...new Set(tagMatches.map(t => t.specialist_id))];
            }

            // 2. Основной запрос
            let query = supabase
                .from('specialist_profiles')
                .select(`*, profiles!inner(*), categories(name)`)
                .eq('category_id', categoryId); // <--- ВОТ ГЛАВНЫЙ ФИЛЬТР

            // Если он не работает, значит у юзера в базе не тот ID, или ID категории приходит неверный

            if (validSpecialistIds !== null) {
                if (validSpecialistIds.length === 0) {
                    setItems([]); setLoading(false); return;
                }
                query = query.in('id', validSpecialistIds);
            }

            if (sortBy === 'price_asc') query = query.order('price_start', { ascending: true });
            if (sortBy === 'price_desc') query = query.order('price_start', { ascending: false });

            const { data, error } = await query;
            
            if (error) {
                console.error("❌ Ошибка запроса:", error);
                throw error;
            }

            console.log(`✅ Найдено: ${data?.length} чел.`);

            const formatted = data.map((item: any) => ({
                id: item.id,
                full_name: item.profiles.full_name,
                avatar_url: item.profiles.avatar_url,
                city: item.profiles.city,
                experience_years: item.experience_years,
                price_start: item.price_start,
                avg_rating: 5.0,
                category_name: item.categories?.name
            }));

            setItems(formatted);

        } else {
            // Для заведений
            let query = supabase
                .from('venue_profiles')
                .select('*, profiles(*), categories(name)')
                .eq('category_id', categoryId); // Фильтр для заведений
            
            const { data } = await query;
            const formatted = data?.map((item: any) => ({
                id: item.id,
                full_name: item.profiles.full_name,
                avatar_url: item.profiles.avatar_url,
                city: item.profiles.city,
                capacity: item.capacity,
                category_name: item.categories?.name
            })) || [];
            setItems(formatted);
        }
    } catch (e) {
        console.log("Error:", e);
    } finally {
        setLoading(false);
    }
  }

  const toggleTag = (tagId: number) => {
      if (selectedTags.includes(tagId)) setSelectedTags(prev => prev.filter(t => t !== tagId));
      else setSelectedTags(prev => [...prev, tagId]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader title={name as string} />
      
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.controlBtn, selectedTags.length > 0 && styles.activeBtn]} 
            onPress={() => setFilterModalVisible(true)}
          >
              <Icon name="filter" type="feather" size={16} color={selectedTags.length > 0 ? '#000' : '#fff'} />
              <Text style={[styles.btnText, selectedTags.length > 0 && { color: '#000' }]}>
                  {selectedTags.length > 0 ? `Навыки (${selectedTags.length})` : 'Навыки'}
              </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlBtn} 
            onPress={() => setSortModalVisible(true)}
          >
              <Icon name="align-left" type="feather" size={16} color="#fff" />
              <Text style={styles.btnText}>
                  {sortBy === 'default' ? 'Сортировка' : 'Сортировка'}
              </Text>
          </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={theme.colors.primary} size="large" />
      ) : (
        <FlatList
            data={items}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <ProfileCard item={item} type={type as any} />}
            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                     <Icon name="search" type="feather" size={60} color="#2D2638" />
                     <Text style={{ color: theme.colors.grey2, marginTop: 15, fontWeight: '600' }}>
                         {items.length === 0 ? 'Никого нет' : 'Ничего не найдено'}
                     </Text>
                     
                     {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ (Убери потом) */}
                     <Text style={{ color: 'gray', fontSize: 10, marginTop: 20 }}>
                         Debug: Category ID {categoryId} ({type})
                     </Text>
                </View>
            }
        />
      )}

      {/* МОДАЛКА ФИЛЬТРОВ */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: '#1A1625', paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Выберите навыки</Text>
                      <TouchableOpacity onPress={() => setFilterModalVisible(false)}><Icon name="x" type="feather" color="#A09BAF" /></TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 400 }}>
                      <View style={styles.tagsGrid}>
                          {subcategories.map((sub) => {
                              const isActive = selectedTags.includes(sub.id);
                              return (
                                  <TouchableOpacity key={sub.id} style={[styles.tagChip, isActive && styles.activeTagChip]} onPress={() => toggleTag(sub.id)}>
                                      <Text style={[styles.tagText, isActive && { color: '#000' }]}>{sub.name}</Text>
                                  </TouchableOpacity>
                              )
                          })}
                      </View>
                  </ScrollView>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterModalVisible(false)}>
                      <Text style={{ color: '#000', fontWeight: 'bold' }}>Применить</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* МОДАЛКА СОРТИРОВКИ */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSortModalVisible(false)}>
              <View style={[styles.modalContent, { backgroundColor: '#1A1625', paddingBottom: insets.bottom + 20 }]}>
                  <Text style={styles.modalTitle}>Сортировка</Text>
                  {[
                      { label: 'По умолчанию', value: 'default' },
                      { label: 'Сначала дешевые', value: 'price_asc' },
                      { label: 'Сначала дорогие', value: 'price_desc' },
                  ].map((opt) => (
                      <TouchableOpacity key={opt.value} style={styles.sortItem} onPress={() => { setSortBy(opt.value as any); setSortModalVisible(false); }}>
                          <Text style={{ fontSize: 16, color: sortBy === opt.value ? '#00FFCC' : '#fff' }}>{opt.label}</Text>
                          {sortBy === opt.value && <Icon name="check" type="feather" color="#00FFCC" />}
                      </TouchableOpacity>
                  ))}
              </View>
          </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  topBar: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  controlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A1625', borderWidth: 1, borderColor: '#2D2638', gap: 8 },
  activeBtn: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#2D2638', backgroundColor: '#121212' },
  activeTagChip: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  tagText: { color: '#A09BAF', fontWeight: '600' },
  applyBtn: { backgroundColor: '#00FFCC', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  sortItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2D2638' }
});