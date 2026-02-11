import { Icon, Text, useTheme } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 60) / 3;

// 🔥 УЛУЧШЕННЫЙ ПОДБОР ИКОНОК И ЦВЕТОВ (Под все 12 категорий)
const getCategoryStyle = (name: string) => {
  if (!name) return { icon: 'grid', color: '#00FFCC' };
  const n = name.toLowerCase();
  
  // 1. IT и Диджитал
  if (n.includes('it') || n.includes('диджитал')) 
    return { icon: 'monitor', color: '#00D2D3' }; // Неоновый Циан

  // 2. Автоуслуги
  if (n.includes('авто') || n.includes('машина')) 
    return { icon: 'tool', color: '#FF4757' }; // Неоновый Красный

  // 3. Барбершопы
  if (n.includes('барбер') || n.includes('стриж')) 
    return { icon: 'scissors', color: '#2ED573' }; // Неоновый Зеленый

  // 4. Дизайн и Реклама (Был квадратик)
  if (n.includes('дизайн') || n.includes('реклама')) 
    return { icon: 'pen-tool', color: '#FFA502' }; // Оранжевый

  // 5. Ивенты и Праздники (Был квадратик)
  if (n.includes('ивент') || n.includes('праздник')) 
    return { icon: 'gift', color: '#FF6B81' }; // Розовый

  // 6. Клининг и Дом
  if (n.includes('клининг') || n.includes('уборка') || n.includes('дом')) 
    return { icon: 'home', color: '#7BED9F' }; // Светло-зеленый

  // 7. Медицина (Был квадратик)
  if (n.includes('мед') || n.includes('врач')) 
    return { icon: 'activity', color: '#FF6348' }; // Томатный

  // 8. Обучение (Был квадратик)
  if (n.includes('обучение') || n.includes('репетитор')) 
    return { icon: 'book-open', color: '#1E90FF' }; // Ярко-синий

  // 9. Ремонт и Стройка
  if (n.includes('ремонт') || n.includes('строй')) 
    return { icon: 'layers', color: '#A55EEA' }; // Фиолетовый

  // 10. Салоны Красоты (Был квадратик)
  if (n.includes('салон') || n.includes('красота')) 
    return { icon: 'smile', color: '#E056FD' }; // Пурпурный

  // 11. Фото и Видео (Был квадратик)
  if (n.includes('фото') || n.includes('видео')) 
    return { icon: 'camera', color: '#3742fa' }; // Индиго

  // 12. Юридические услуги
  if (n.includes('юрист') || n.includes('прав')) 
    return { icon: 'briefcase', color: '#5352ED' }; // Синий

  // Дефолт (на всякий случай)
  return { icon: 'grid', color: '#00FFCC' };
};

export default function ClientHome() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [mode, setMode] = useState<'specialist' | 'venue'>('specialist');

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', mode).order('name');
    if (data) setCategories(data);
  }, [mode]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // --- ШАПКА ---
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Добро пожаловать!</Text>
              <Text h4 style={styles.name}>
                  {user?.user_metadata?.full_name?.split(' ')[0] || 'Гость'}
              </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={styles.headerBtn}
                onPress={() => router.push('/(client)/favorites')}
              >
                 <Icon name="heart" type="feather" color="#fff" size={22} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.headerBtn}
                onPress={() => router.push('/notifications')}
              >
                 <Icon name="bell" type="feather" color="#fff" size={22} />
                 <View style={styles.redDot} />
              </TouchableOpacity>
          </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/(client)/ai-search')} 
        activeOpacity={0.9}
        style={{ marginBottom: 25 }}
      >
        <LinearGradient
            colors={['#8A2BE2', '#00FFCC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiBanner}
        >
            <View style={styles.aiContent}>
                <Text style={styles.aiTitle}>AI ПОИСК</Text>
                <Text style={styles.aiSub}>Найдите любую услугу мгновенно</Text>
            </View>
            <Icon name="zap" type="feather" color="#fff" size={32} />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.modeToggle}>
        {(['specialist', 'venue'] as const).map((m) => (
          <TouchableOpacity 
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeText, { color: mode === m ? '#00FFCC' : '#6B6675' }]}>
              {m === 'specialist' ? 'МАСТЕРА' : 'ЗАВЕДЕНИЯ'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ 
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 100 
        }}
        renderItem={({ item }) => {
            const style = getCategoryStyle(item.name);
            return (
                <TouchableOpacity 
                  style={styles.catItem} 
                  onPress={() => router.push({ pathname: '/(client)/category-results', params: { id: item.id, name: item.name, type: mode } } as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.catIconBox, { borderColor: style.color + '40', shadowColor: style.color }]}>
                      <Icon name={style.icon} type="feather" size={32} color={style.color} />
                  </View>
                  <Text style={styles.catLabel} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
            )
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingBottom: 10 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { color: '#A09BAF', fontSize: 14, fontWeight: '500' },
  name: { color: '#FFF', fontWeight: '900' },
  headerBtn: { 
      width: 44, height: 44, borderRadius: 14, 
      backgroundColor: '#1A1625', justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: '#2D2638'
  },
  redDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF0055' },
  aiBanner: { 
      padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center',
      shadowColor: "#8A2BE2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  aiContent: { flex: 1 },
  aiTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  aiSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#1A1625', borderRadius: 16, padding: 4, marginBottom: 25, borderWidth: 1, borderColor: '#2D2638' },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  modeBtnActive: { backgroundColor: '#2D2638' },
  modeText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  columnWrapper: { gap: 15 },
  catItem: { width: COLUMN_WIDTH, marginBottom: 20, alignItems: 'center' },
  catIconBox: { 
      width: '100%', aspectRatio: 1, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#1A1625', borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5
  },
  catLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 10, color: '#E2E8F0' }
});