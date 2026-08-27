import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Store, ShoppingBag, Zap, Shield, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { supabase, type Product } from "@/lib/supabase";

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, sellers(name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      const products = (data || []).map((p: any) => ({
        ...p,
        seller_name: p.sellers?.name,
      })) as Product[];
      setFeatured(products);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-xs text-accent font-medium tracking-wider uppercase">YuuStore Inc. since 2022</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold text-heading leading-tight">
            Le centre commercial
            <br />
            <span className="text-accent">dans votre poche.</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Achetez, vendez et commandez des articles physiques et virtuels. Vêtements, téléphones,
            conception d'affiches, sites web — tout au même endroit.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              to="/catalogue"
              className="px-6 h-12 rounded-lg bg-accent text-background font-semibold flex items-center gap-2 hover:bg-accent-hover transition-colors"
            >
              Découvrir <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/vendeur/inscription"
              className="px-6 h-12 rounded-lg bg-surface border border-surface-light text-heading font-semibold flex items-center gap-2 hover:border-accent transition-colors"
            >
              <Store className="h-4 w-4" /> Devenir vendeur
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Taux de satisfaction", value: "99.9%", icon: <TrendingUp className="h-5 w-5 text-accent" /> },
            { label: "Clients", value: "500+", icon: <ShoppingBag className="h-5 w-5 text-accent" /> },
            { label: "Vendeurs actifs", value: "50+", icon: <Store className="h-5 w-5 text-accent" /> },
            { label: "Sécurité", value: "24/7", icon: <Shield className="h-5 w-5 text-accent" /> },
          ].map((s, i) => (
            <div key={i} className="bg-surface border border-surface-light rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="font-display text-2xl font-bold text-accent">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-heading">Produits récents</h2>
            <Link to="/catalogue" className="text-sm text-accent font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl shimmer" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted text-sm">Aucun produit pour l'instant. Soyez le premier à vendre !</p>
              <Link to="/vendeur/inscription" className="inline-flex items-center gap-2 mt-4 text-accent font-semibold text-sm">
                <Store className="h-4 w-4" /> Devenir vendeur
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CEO Quote */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto bg-surface border border-surface-light rounded-2xl p-8 text-center">
          <p className="font-display text-xl text-heading italic leading-relaxed">
            "Je tiens à remercier tout un chacun d'entre vous, clients et partenaires pour
            ce choix qui constitue un soutien infini dans cette affaire, ma première."
          </p>
          <p className="mt-4 font-semibold text-accent">Guy Muzongo</p>
          <p className="text-sm text-muted">CEO & Fondateur, YuuStore Inc.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
