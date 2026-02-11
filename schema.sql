-- ==========================================================
-- 🔄 1. СБРОС (ОЧИСТКА СТАРЫХ ТАБЛИЦ)
-- ==========================================================
DROP VIEW IF EXISTS specialist_search_view;
DROP VIEW IF EXISTS global_search_view;
DROP TABLE IF EXISTS busy_dates;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS portfolio;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS category_messages;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS venue_profiles;
DROP TABLE IF EXISTS specialist_profiles;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS profiles;

-- ==========================================================
-- 🏗 2. СОЗДАНИЕ ТАБЛИЦ
-- ==========================================================

-- Профили (Базовая инфа)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('client', 'specialist', 'venue', 'admin')),
  city TEXT,
  phone TEXT,
  push_token TEXT,
  balance INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Категории (Маникюр, Кофейня и т.д.)
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('specialist', 'venue')),
  image_url TEXT,
  bg_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Анкета Специалиста
CREATE TABLE public.specialist_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  price_start INTEGER DEFAULT 0, -- Для фильтра "Выгодно"
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Анкета Заведения
CREATE TABLE public.venue_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  description TEXT,
  address TEXT,
  capacity INTEGER DEFAULT 0,
  latitude DOUBLE PRECISION, -- Для Карты
  longitude DOUBLE PRECISION, -- Для Карты
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Бронирования
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  specialist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, rejected, completed
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Отзывы (Для рейтинга)
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Портфолио (Рилсы и Фото)
CREATE TABLE public.portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image', -- image или video
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Личные сообщения
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Избранное
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id)
);

-- Уведомления
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Занятые даты (выходные)
CREATE TABLE public.busy_dates (
  id SERIAL PRIMARY KEY,
  specialist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL
);

-- ==========================================================
-- 👁 3. ПРЕДСТАВЛЕНИЯ (VIEWS) - МОЗГИ ПОИСКА
-- ==========================================================

-- Поиск специалистов (Для списков и фильтров)
CREATE OR REPLACE VIEW specialist_search_view AS
SELECT 
    sp.id, 
    sp.bio, 
    sp.experience_years, 
    sp.price_start, 
    sp.category_id,
    p.full_name, 
    p.avatar_url, 
    p.city, 
    p.role,
    cat.name as category_name,
    COALESCE(AVG(r.rating), 0) as avg_rating, -- Средний рейтинг
    COUNT(r.id) as review_count -- Кол-во отзывов для бейджа "Популярен"
FROM specialist_profiles sp
JOIN profiles p ON sp.id = p.id
LEFT JOIN categories cat ON sp.category_id = cat.id
LEFT JOIN reviews r ON sp.id = r.target_id
GROUP BY sp.id, p.id, cat.name;

-- Глобальный поиск (Для AI Search и Заведений)
CREATE OR REPLACE VIEW global_search_view AS
SELECT 
    p.id, 
    p.full_name, 
    p.avatar_url, 
    p.city, 
    p.role,
    cat.name as category_name,
    COALESCE(sp.bio, vp.description) as description,
    COALESCE(vp.latitude, 0) as latitude,
    COALESCE(vp.longitude, 0) as longitude
FROM profiles p
LEFT JOIN specialist_profiles sp ON p.id = sp.id
LEFT JOIN venue_profiles vp ON p.id = vp.id
LEFT JOIN categories cat ON (sp.category_id = cat.id OR vp.category_id = cat.id)
WHERE p.role IN ('specialist', 'venue');

-- ==========================================================
-- ⚡ 4. ФУНКЦИИ (ЛОГИКА)
-- ==========================================================

-- Лента Рилс (Видео портфолио)
CREATE OR REPLACE FUNCTION get_video_feed()
RETURNS TABLE (id UUID, file_url TEXT, description TEXT, user_id UUID, full_name TEXT, avatar_url TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.file_url, 
    COALESCE(sp.bio, vp.description, '...') as description, 
    prof.id as user_id, 
    prof.full_name, 
    prof.avatar_url, 
    prof.role
  FROM portfolio p
  JOIN profiles prof ON p.specialist_id = prof.id
  LEFT JOIN specialist_profiles sp ON prof.id = sp.id
  LEFT JOIN venue_profiles vp ON prof.id = vp.id
  WHERE p.file_type = 'video'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Мои чаты (Последние сообщения)
CREATE OR REPLACE FUNCTION get_my_chats()
RETURNS TABLE (partner_id UUID, full_name TEXT, avatar_url TEXT, last_message TEXT, last_message_time TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  WITH last_messages AS (
    SELECT
      CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END AS p_id,
      m.content, m.created_at,
      ROW_NUMBER() OVER (PARTITION BY CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END ORDER BY m.created_at DESC) as rn
    FROM messages m
    WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
  )
  SELECT p.id, p.full_name, p.avatar_url, lm.content, lm.created_at
  FROM last_messages lm
  JOIN profiles p ON p.id = lm.p_id
  WHERE lm.rn = 1
  ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаление аккаунта (Safety)
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 🛡 5. БЕЗОПАСНОСТЬ (RLS) - ЧТОБЫ ДАННЫЕ БЫЛИ ВИДНЫ
-- ==========================================================

-- Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Политики (Чтение для всех, запись только для владельца)
-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- SPECIALIST & VENUE PROFILES
CREATE POLICY "Specialists viewable by everyone" ON specialist_profiles FOR SELECT USING (true);
CREATE POLICY "Venues viewable by everyone" ON venue_profiles FOR SELECT USING (true);
CREATE POLICY "Specialists update own" ON specialist_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Venues update own" ON venue_profiles FOR ALL USING (auth.uid() = id);

-- CATEGORIES
CREATE POLICY "Categories viewable by everyone" ON categories FOR SELECT USING (true);

-- REVIEWS
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated can create reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PORTFOLIO
CREATE POLICY "Portfolio viewable by everyone" ON portfolio FOR SELECT USING (true);
CREATE POLICY "Users update own portfolio" ON portfolio FOR ALL USING (auth.uid() = specialist_id);

-- ==========================================================
-- ⚙️ 6. ТРИГГЕРЫ (АВТОМАТИЗАЦИЯ)
-- ==========================================================

-- Авто-создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'https://i.pravatar.cc/150?u=' || NEW.id); -- Дефолтная аватарка
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();