import { useIsFocused } from '@react-navigation/native';
import { Icon, Text, useTheme } from '@rneui/themed';
import { ResizeMode, Video } from 'expo-av';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // <--- НУЖЕН ЭТОТ ИМПОРТ
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../../components/UserAvatar';
import { supabase } from '../../lib/supabase';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReelsScreen() {
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  
  const [videos, setVideos] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<any>(null);

  // Расчет высоты (Экран минус меню снизу)
  const BOTTOM_TAB_HEIGHT = 60 + (Platform.OS === 'ios' ? insets.bottom : 0); // Чуть подправил для Android
  const ITEM_HEIGHT = SCREEN_HEIGHT - BOTTOM_TAB_HEIGHT;

  useFocusEffect(useCallback(() => {
      // Здесь должен быть твой RPC запрос или обычный select
      // Пока сделаем select из portfolio, где in_feed = true
      fetchReels();
  }, []));

  async function fetchReels() {
      // Берем видео, у которых стоит галочка "В ленте"
      const { data } = await supabase
        .from('portfolio')
        .select('*, profiles(full_name, avatar_url)')
        .eq('file_type', 'video')
        .eq('in_feed', true) 
        .order('created_at', { ascending: false });
        
      if (data && data.length > 0) {
          setVideos(data);
          if (!currentId) setCurrentId(data[0].id);
      }
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
        const item = viewableItems[0].item;
        setCurrentId(item.id);
    }
  }).current;

  const renderItem = ({ item }: { item: any }) => {
    const isPlaying = item.id === currentId && isFocused;

    return (
        <View style={{ width: SCREEN_WIDTH, height: ITEM_HEIGHT, backgroundColor: 'black' }}>
            <Video 
                source={{ uri: item.file_url }} 
                style={StyleSheet.absoluteFill} 
                resizeMode={ResizeMode.COVER} // Заполняет весь экран без полос
                isLooping 
                shouldPlay={isPlaying} 
                isMuted={false}
                posterSource={{ uri: item.thumbnail_url }} // Показываем картинку, пока видео грузится
                usePoster
            />

            {/* ПЛАВНЫЙ ГРАДИЕНТ СНИЗУ (Вместо резкой линии) */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
            />

            {/* КОНТЕНТ ПОВЕРХ ВИДЕО */}
            <View style={styles.overlayContent}>
                
                {/* ЛЕВАЯ ЧАСТЬ: ИНФО */}
                <View style={{ flex: 1, paddingRight: 20 }}>
                    <TouchableOpacity 
                        style={styles.userInfo}
                        onPress={() => router.push(`/specialist-details/${item.specialist_id}`)}
                    >
                        <UserAvatar avatarUrl={item.profiles?.avatar_url} size={45} />
                        <Text style={styles.userName}>@{item.profiles?.full_name}</Text>
                    </TouchableOpacity>

                    {/* Описание (если есть, или дефолтное) */}
                    <Text style={styles.description} numberOfLines={3}>
                        Смотрите мои работы в профиле! 🔥
                    </Text>
                </View>

                {/* ПРАВАЯ ЧАСТЬ: КНОПКИ */}
                <View style={styles.actionsColumn}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Icon name="heart" type="font-awesome" color="white" size={30} style={styles.shadow} />
                        <Text style={styles.actionText}>Like</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => router.push(`/chat/${item.specialist_id}`)}
                    >
                        <Icon name="message-circle" type="feather" color="white" size={32} style={styles.shadow} />
                        <Text style={styles.actionText}>Чат</Text>
                    </TouchableOpacity>
                    
                     <TouchableOpacity style={styles.actionBtn}>
                        <Icon name="share-2" type="feather" color="white" size={30} style={styles.shadow} />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <FlatList 
        data={videos} 
        renderItem={renderItem} 
        keyExtractor={item => item.id.toString()} 
        pagingEnabled 
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false} 
        onViewableItemsChanged={onViewableItemsChanged} 
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }} 
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        })}
        ListEmptyComponent={
            <View style={styles.empty}>
                <Icon name="film" type="feather" size={60} color="#333" />
                <Text style={{color: '#666', marginTop: 20}}>Нет видео в ленте</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    height: 250, // Высота затемнения
  },
  overlayContent: { 
    position: 'absolute', 
    bottom: 20, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 10
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10, textShadowColor: 'black', textShadowRadius: 3 },
  description: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, textShadowColor: 'black', textShadowRadius: 2 },
  
  actionsColumn: { alignItems: 'center', gap: 20, marginLeft: 10 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, marginTop: 4, fontWeight: '600', textShadowColor: 'black', textShadowRadius: 2 },
  shadow: { textShadowColor: 'black', textShadowRadius: 5 },
  empty: { flex: 1, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }
});