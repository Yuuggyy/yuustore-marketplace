import { createClient } from "@supabase/supabase-js";

// YuuStore Supabase project — replace with actual credentials when ready
const SUPABASE_URL = "https://cifujdeelritrnnyzupw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZnVqZGVlbHJpdHJubnl6dXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDA2MTYsImV4cCI6MjEwMzUxNjYxNn0.8hK_qhIcE__0YlWBZJtZbPwfe0s4vUOWqhj1tzNYv14";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin emails
export const ADMIN_EMAILS = ["yuustore169@gmail.com", "guymuzongo1234@gmail.com"];

export const isAdminEmail = (email: string | null | undefined) =>
  !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());

// Types
export type Seller = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
  user_id: string | null;
};

export type Product = {
  id: string;
  seller_id: string;
  seller_name?: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  image_urls: string[];
  status: "pending" | "approved" | "rejected";
  stock: number | null;
  specs: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  client_name: string | null;
  client_whatsapp: string;
  items: {
    product_id: string;
    product_name: string;
    seller_id: string;
    seller_name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }[];
  total: number;
  currency: string;
  status: "new" | "contacted" | "delivered" | "cancelled";
  notes: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  product_count?: number;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
};
