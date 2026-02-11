import { Icon, useTheme } from '@rneui/themed';
import { Image } from 'expo-image'; // <--- Импортируем из новой библиотеки
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  activeOpacity?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatarUrl, 
  size = 50, 
  onPress 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const backgroundColor = isDark ? theme.colors.grey1 : '#E2E8F0';
  const iconColor = isDark ? '#94A3B8' : '#64748B';
  const hasImage = avatarUrl && avatarUrl.trim() !== '';

  const Content = (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor, overflow: 'hidden' }]}>
       {hasImage ? (
         <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover" // Вместо resizeMode
            transition={500}   // Плавное появление (0.5 сек)
            cachePolicy="memory-disk" // Жесткое кэширование
         />
       ) : (
         <View style={[styles.placeholder, { width: size, height: size }]}>
            <Icon name="user" type="feather" color={iconColor} size={size * 0.5} />
         </View>
       )}
    </View>
  );

  if (onPress) {
      return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{Content}</TouchableOpacity>;
  }

  return Content;
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  placeholder: { justifyContent: 'center', alignItems: 'center' }
});