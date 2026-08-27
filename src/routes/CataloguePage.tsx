import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { supabase, type Product, type Category } from "@/lib/supabase";

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "price-asc" | "price-desc">("recent");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*, sellers(name)")
      .eq("status", "approved");

    if (activeCategory !== "all") {
      query = query.eq("category", activeCategory);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    if (sortBy === "price-asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data } = await query.limit(100);

    const enriched = (data || []).map((p: any) => ({
      ...p,
      seller_name: p.sellers?.name,
    })) as Product[];

    setProducts(enriched);
    setLoading(false);
  }, [activeCategory, search, sortBy]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      setCategories(cats || []);
      fetchProducts();
    })();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-heading">Catalogue</h1>
          <p className="text-muted text-sm mt-1">
            {loading ? "Chargement..." : `${products.length} produit${products.length > 1 ? "s" : ""} disponible${products.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full bg-surface border border-surface-light rounded-lg pl-10 pr-4 h-11 text-sm focus:border-accent outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-11 h-11 rounded-lg bg-surface border border-surface-light flex items-center justify-center hover:border-accent transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className={`mb-6 ${showFilters ? "block" : "hidden"} sm:block`}>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === "all"
                  ? "bg-accent text-background"
                  : "bg-surface border border-surface-light text-muted hover:text-heading"
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === cat.name
                    ? "bg-accent text-background"
                    : "bg-surface border border-surface-light text-muted hover:text-heading"
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2 mt-3">
            {[
              { id: "recent", label: "Récents" },
              { id: "price-asc", label: "Prix croissant" },
              { id: "price-desc", label: "Prix décroissant" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === s.id
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-surface text-muted border border-surface-light"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl shimmer" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted">Aucun produit trouvé.</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("all"); }}
              className="mt-4 text-accent text-sm font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
