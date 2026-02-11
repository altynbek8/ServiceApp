import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator'; // <--- СЖИМАТЕЛЬ
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

/**
 * Загружает файл в Supabase Storage.
 * Автоматически сжимает изображения.
 */
export async function uploadFileToSupabase(bucket: string, uri: string, fileName: string) {
  try {
    let uploadUri = uri;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

    // 1. ЕСЛИ ЭТО КАРТИНКА -> СЖИМАЕМ
    if (isImage) {
        console.log('🔄 Сжимаем фото перед загрузкой...');
        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }], // Уменьшаем ширину до 1080px (достаточно для телефона)
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // Качество 60% (глазом не заметно, вес в 10 раз меньше)
        );
        uploadUri = manipResult.uri;
    }

    console.log(`[Uploader] Чтение файла: ${uploadUri}`);
    
    // 2. Читаем файл как base64
    const base64 = await FileSystem.readAsStringAsync(uploadUri, {
      encoding: 'base64' as any,
    });

    // Определяем MIME-тип
    const isVideo = ext === 'mp4' || ext === 'mov';
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

    console.log(`[Uploader] Загрузка в бакет: ${bucket}`);

    // 3. Загружаем
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('[Uploader] Ошибка SDK:', error.message);
      throw new Error(error.message);
    }

    // 4. Получаем ссылку
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log('[Uploader] Успешно:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('[Uploader] Критическая ошибка:', error);
    throw error;
  }
}