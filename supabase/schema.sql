-- YuuStore Marketplace — Supabase Schema
-- Run this in your Supabase SQL editor

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SELLERS ============
CREATE TABLE IF NOT EXISTS sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CDF',
  category TEXT,
  image_urls TEXT[] DEFAULT '{}',
  stock INTEGER,
  specs JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT,
  client_whatsapp TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CDF',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SITE SETTINGS ============
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

-- ============ RLS POLICIES ============

-- Categories: everyone can read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);
-- Only admin can write
CREATE POLICY "categories_write" ON categories FOR ALL
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'))
  WITH CHECK (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));

-- Sellers: everyone can read (for product display)
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers_read" ON sellers FOR SELECT USING (true);
-- Users can insert their own seller profile
CREATE POLICY "sellers_insert_own" ON sellers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Users can update their own profile
CREATE POLICY "sellers_update_own" ON sellers FOR UPDATE
  USING (auth.uid() = user_id);
-- Admin can manage all
CREATE POLICY "sellers_admin" ON sellers FOR ALL
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));

-- Products: everyone can read approved products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_approved" ON products FOR SELECT
  USING (status = 'approved' OR auth.uid() = seller_id);
-- Sellers can insert their own products
CREATE POLICY "products_insert_own" ON products FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM sellers WHERE id = seller_id));
-- Sellers can update their own products
CREATE POLICY "products_update_own" ON products FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM sellers WHERE id = seller_id));
-- Admin can manage all
CREATE POLICY "products_admin" ON products FOR ALL
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));

-- Orders: anyone can create (no login required)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
-- Only admin can read
CREATE POLICY "orders_admin_read" ON orders FOR SELECT
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));
-- Only admin can update
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));

-- Site settings: everyone can read
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON site_settings FOR SELECT USING (true);
-- Only admin can write
CREATE POLICY "settings_write" ON site_settings FOR ALL
  USING (auth.jwt() ->> 'email' IN ('yuustore169@gmail.com', 'guymuzongo1234@gmail.com'));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "product_images_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============ DEFAULT CATEGORIES ============
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Vêtements', '👕', 1),
  ('Téléphones', '📱', 2),
  ('Électronique', '🔌', 3),
  ('Maison', '🏠', 4),
  ('Beauté', '💄', 5),
  ('Accessoires', '👜', 6),
  ('Services', '🛠️', 7),
  ('Autre', '📦', 8)
ON CONFLICT DO NOTHING;
