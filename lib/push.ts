// @ts-nocheck
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Проверка: запущено ли в Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  if (isExpoGo) {
    console.log("Уведомления пропущены: Expo Go не поддерживает пуши в SDK 53+");
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            if (tokenData.data) {
                await supabase.from('profiles').update({ push_token: tokenData.data }).eq('id', userId);
            }
        }
    } catch (e) { console.log("Push Error:", e); }
  }
}

export async function sendPushNotification(targetUserId: string, title: string, body: string, data: any = {}) {
  try {
      // Сохраняем в БД всегда, даже если пуш не отправится
      await supabase.from('notifications').insert({ user_id: targetUserId, title, body, data });

      if (isExpoGo) return; // В Expo Go не пытаемся отправить через сервер Expo

      const { data: profile } = await supabase.from('profiles').select('push_token').eq('id', targetUserId).single();
      
      if (profile?.push_token) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: profile.push_token, sound: 'default', title, body, data }),
          });
      }
  } catch (error) { console.log(error); }
}