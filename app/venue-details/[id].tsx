import { Button, Icon, Text, useTheme } from '@rneui/themed';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share, // <--- ИМПОРТ
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const { width } = Dimensions.get('window');

export default function VenueDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [bookingDate, setBookingDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  async function fetchDetails() {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('venue_profiles')
            .select(`*, profiles(full_name, avatar_url, city), categories(name), reviews:reviews(rating)`)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (data) {
            const ratings = data.reviews || [];
            const avg = ratings.length > 0 
                ? (ratings.reduce((acc: any, r: any) => acc + r.rating, 0) / ratings.length).toFixed(1)
                : "4.8";
            setVenue({ ...data, avgRating: avg });

            const { data: portData } = await supabase.from('portfolio').select('*').eq('specialist_id', id);
            if (portData) setPortfolio(portData);
        }
    } catch (e: any) { console.error(e.message); } finally { setLoading(false); }
  }

  function openMap() {
    if (!venue?.latitude || !venue?.longitude) return Alert.alert("Упс", "Координаты заведения не указаны");
    const url = Platform.select({
        ios: `maps:0,0?q=${venue.latitude},${venue.longitude}`,
        android: `geo:0,0?q=${venue.latitude},${venue.longitude}(${venue.profiles?.full_name})`
    });
    if (url) Linking.openURL(url);
  }

  // ФУНКЦИЯ ПОДЕЛИТЬСЯ
  const handleShare = async () => {
      try {
          if (!venue) return;
          await Share.share({
              message: `Классное место: ${venue.profiles?.full_name}!\n📍 Адрес: ${venue.address}\n\nНайдено в ServiceApp.`,
          });
      } catch (e) { console.log(e); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* КНОПКА НАЗАД (Плавающая) */}
      <TouchableOpacity 
        style={[styles.backBtn, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <Icon name="arrow-left" type="feather" size={24} color="#fff" />
      </TouchableOpacity>

      {/* КНОПКА ПОДЕЛИТЬСЯ (Плавающая справа) */}
      <TouchableOpacity 
        style={[styles.shareBtn, { top: insets.top + 10 }]} 
        onPress={handleShare}
      >
        <Icon name="share" type="feather" size={22} color="#fff" />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Image source={{ uri: portfolio[0]?.file_url || 'https://picsum.photos/800/600' }} style={styles.coverImage} />
          
          <View style={styles.content}>
              <Text h3 style={{ color: theme.colors.black, fontWeight: '900' }}>{venue?.profiles?.full_name}</Text>
              <View style={styles.tagRow}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{venue?.categories?.name}</Text></View>
                  <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}><Text style={[styles.badgeText, { color: '#2E7D32' }]}>Открыто</Text></View>
              </View>

              <View style={[styles.infoPanel, { backgroundColor: theme.colors.grey0 }]}>
                  <TouchableOpacity style={styles.infoItem} onPress={openMap}>
                      <Icon name="map-pin" type="feather" size={20} color={theme.colors.primary} />
                      <Text style={styles.infoVal}>Карта</Text>
                      <Text style={styles.infoSub}>Открыть</Text>
                  </TouchableOpacity>
                  <View style={[styles.infoItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ddd' }]}>
                      <Icon name="users" type="feather" size={20} color={theme.colors.primary} />
                      <Text style={styles.infoVal}>{venue?.capacity || 0}</Text>
                      <Text style={styles.infoSub}>Мест</Text>
                  </View>
                  <View style={styles.infoItem}>
                      <Icon name="star" type="font-awesome" size={20} color="#FFD700" />
                      <Text style={styles.infoVal}>{venue?.avgRating}</Text>
                      <Text style={styles.infoSub}>Рейтинг</Text>
                  </View>
              </View>

              <Text style={[styles.sectionTitle, { color: theme.colors.black }]}>О заведении</Text>
              <Text style={[styles.description, { color: theme.colors.black }]}>{venue?.description || "Описание скоро появится..."}</Text>
              <Text style={styles.address}>📍 {venue?.address}</Text>

              {portfolio.length > 0 && (
                  <View style={{ marginTop: 25 }}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.black, marginBottom: 15 }]}>Галерея</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {portfolio.map((img, index) => <Image key={index} source={{ uri: img.file_url }} style={styles.galleryImg} />)}
                      </ScrollView>
                  </View>
              )}
          </View>
        </ScrollView>
      )}

      {/* ФУТЕР */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, borderTopColor: theme.colors.grey1 }]}>
          <TouchableOpacity onPress={() => router.push(`/chat/${id}`)} style={styles.chatBtn}>
            <Icon name="message-circle" type="feather" color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bookBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setModalVisible(true)}>
              <Text style={styles.bookBtnText}>Забронировать стол</Text>
          </TouchableOpacity>
      </View>

      {/* МОДАЛКА */}
      <Modal visible={modalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.black }]}>Выберите дату визита</Text>
                  <Calendar 
                    onDayPress={(day: any) => setBookingDate(day.dateString)}
                    markedDates={{ [bookingDate]: { selected: true, selectedColor: theme.colors.primary } }}
                    theme={{ calendarBackground: 'transparent', dayTextColor: theme.colors.black, arrowColor: theme.colors.primary }}
                  />
                  <Button 
                    title="Запросить бронирование" 
                    disabled={!bookingDate}
                    buttonStyle={{ backgroundColor: theme.colors.primary, borderRadius: 15, marginTop: 20, height: 55 }}
                    onPress={() => { Alert.alert("Успешно", "Запрос отправлен заведению"); setModalVisible(false); }}
                  />
                  <Button title="Отмена" type="clear" onPress={() => setModalVisible(false)} />
              </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Кнопки поверх фото
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { position: 'absolute', right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  coverImage: { width: '100%', height: 300 },
  content: { padding: 25, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#fff' },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  badge: { backgroundColor: '#F1F3F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#6366f1' },
  infoPanel: { flexDirection: 'row', borderRadius: 25, padding: 20, marginTop: 25, marginBottom: 25 },
  infoItem: { flex: 1, alignItems: 'center', gap: 5 },
  infoVal: { fontSize: 16, fontWeight: '900' },
  infoSub: { fontSize: 10, color: 'gray', textTransform: 'uppercase', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  description: { marginTop: 10, lineHeight: 24, fontSize: 15, opacity: 0.8 },
  address: { marginTop: 15, fontWeight: 'bold', color: '#6366f1' },
  galleryImg: { width: 150, height: 200, borderRadius: 20, marginRight: 12 },
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 15, backgroundColor: '#fff' },
  chatBtn: { width: 60, height: 60, borderRadius: 18, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  bookBtn: { flex: 1, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', padding: 25, borderRadius: 30 },
  modalTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 }
});