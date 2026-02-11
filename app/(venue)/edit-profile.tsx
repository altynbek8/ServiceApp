import { Button, Icon, Input, Text, useTheme } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { UserAvatar } from '../../components/UserAvatar'; // <---
import { supabase } from '../../lib/supabase';
import { uploadFileToSupabase } from '../../lib/uploader';
import { useAuth } from '../../providers/AuthProvider';

export default function EditVenueProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => { if (!authLoading && user) loadData(); }, [authLoading, user]);

  async function loadData() {
    try {
      const { data: catData } = await supabase.from('categories').select('id, name').eq('type', 'venue');
      if (catData) setCategories(catData);
      
      if (!user) return;
      const { data: profile } = await supabase.from('venue_profiles').select('*').eq('id', user.id).single();
      if (profile) { 
          setDescription(profile.description || ''); 
          setAddress(profile.address || ''); 
          setCapacity(profile.capacity ? String(profile.capacity) : ''); 
          setSelectedCategory(profile.category_id); 
          if (profile.latitude && profile.longitude) setLocation({ lat: profile.latitude, lon: profile.longitude }); 
      }
      const { data: mainProfile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
      if (mainProfile) setAvatarUrl(mainProfile.avatar_url);
    } catch (e) { console.log(e); } finally { setFetching(false); }
  }

  async function getCurrentLocation() {
    setLocLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Ошибка', 'Нужен доступ к геолокации');
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      Alert.alert('Успех', 'Координаты определены!');
    } catch (e) { Alert.alert('Ошибка', 'Не удалось определить местоположение'); } finally { setLocLoading(false); }
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) {
        setLoading(true);
        const fileName = `${user?.id}/avatar_${Date.now()}.jpg`;
        const publicUrl = await uploadFileToSupabase('avatars', result.assets[0].uri, fileName);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
        setAvatarUrl(publicUrl);
        setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setLoading(true);
    const updates = { 
        id: user.id, description, address, capacity: parseInt(capacity) || 0, category_id: selectedCategory, 
        latitude: location?.lat, longitude: location?.lon 
    };
    const { error } = await supabase.from('venue_profiles').upsert(updates as any);
    setLoading(false);
    if (error) Alert.alert('Ошибка', error.message);
    else { Alert.alert('Успех', 'Профиль сохранен!'); router.back(); }
  }

  if (authLoading || fetching) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Хедер */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <Icon name="arrow-left" type="feather" color={theme.colors.black} />
           </TouchableOpacity>
           <Text h4 style={{ color: theme.colors.black }}>Настройки заведения</Text>
           <View style={{ width: 40 }} />
        </View>

        {/* Аватар */}
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarSection}>
            <UserAvatar avatarUrl={avatarUrl} size={100} />
            <Text style={{ color: theme.colors.primary, marginTop: 10, fontWeight: '600' }}>Логотип заведения</Text>
        </TouchableOpacity>

        {/* Категория */}
        <Text style={[styles.label, {color: theme.colors.grey2}]}>КАТЕГОРИЯ</Text>
        <View style={styles.catContainer}>
          {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                  <TouchableOpacity 
                    key={cat.id} onPress={() => setSelectedCategory(cat.id)}
                    style={[styles.chip, isActive ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.grey0, borderWidth: 1, borderColor: theme.colors.grey1 }]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? '#fff' : theme.colors.black }]}>{cat.name}</Text>
                  </TouchableOpacity>
              )
          })}
        </View>

        {/* Форма */}
        <Input label="Название адреса" value={address} onChangeText={setAddress} placeholder="ул. Абая 10, Алматы" leftIcon={<Icon name="map-pin" type="feather" size={18} color={theme.colors.grey2} />} />
        
        {/* Блок Геолокации */}
        <View style={[styles.geoBlock, { backgroundColor: theme.colors.grey0, borderColor: location ? '#10B981' : theme.colors.grey1 }]}>
            <View>
                <Text style={{ fontWeight: 'bold', color: theme.colors.black }}>Точные координаты</Text>
                <Text style={{ fontSize: 12, color: location ? '#10B981' : 'gray', marginTop: 4 }}>
                    {location ? 'Координаты установлены' : 'Необходимо для карт 2GIS'}
                </Text>
            </View>
            <TouchableOpacity onPress={getCurrentLocation} style={styles.geoBtn}>
                {locLoading ? <ActivityIndicator color={theme.colors.primary} /> : <Icon name="crosshair" type="feather" color={theme.colors.primary} />}
            </TouchableOpacity>
        </View>

        <Input label="Описание" multiline numberOfLines={3} value={description} onChangeText={setDescription} placeholder="Уютная атмосфера, вкусная кухня..." />
        <Input label="Вместимость (чел.)" keyboardType="numeric" value={capacity} onChangeText={setCapacity} placeholder="50" />
        
        <Button title="Сохранить изменения" onPress={saveProfile} loading={loading} containerStyle={{ marginTop: 20 }} />
        <View style={{height: 100}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backBtn: { padding: 10 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  label: { fontSize: 12, fontWeight: '700', marginLeft: 5, marginBottom: 10, textTransform: 'uppercase' },
  catContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  chipText: { fontWeight: '600', fontSize: 14 },
  geoBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  geoBtn: { padding: 10, backgroundColor: '#eee', borderRadius: 12 }
});