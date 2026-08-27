import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isAdminEmail, type Seller } from "./supabase";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSeller: boolean;
  sellerProfile: Seller | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSeller: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = async (userId: string) => {
    const { data } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setSellerProfile(data as Seller | null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s?.user) {
        await fetchSeller(s.user.id);
      } else {
        setSellerProfile(null);
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await fetchSeller(data.session.user.id);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const stableFns = {
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "" },
      });
      if (error) throw error;
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setSellerProfile(null);
    },
  };

  const value = useMemo<AuthCtx>(() => ({
    session,
    user: session?.user ?? null,
    isAdmin: isAdminEmail(session?.user?.email),
    isSeller: sellerProfile?.status === "active",
    sellerProfile,
    loading,
    ...stableFns,
    refreshSeller: async () => {
      if (session?.user) await fetchSeller(session.user.id);
    },
  }), [session, sellerProfile, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
