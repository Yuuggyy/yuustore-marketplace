import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Package, Store, Clock, X, Upload, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { supabase, type Product, type Category } from "@/lib/supabase";
import { toast } from "sonner";

export default function SellerDashboard() {
  const { user, sellerProfile, loading: authLoading, isAdmin, refreshSeller } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<"products" | "profile">("products");

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!sellerProfile) { setLoading(false); return; }
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });
    setProducts(data as Product[] || []);
    setLoading(false);
  }, [sellerProfile]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      setCategories(cats || []);
      fetchProducts();
    })();
  }, [fetchProducts]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "", stock: "" });
    setImageUrls([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      category: p.category,
      stock: p.stock?.toString() || "",
    });
    setImageUrls(p.image_urls || []);
    setShowForm(true);
  };

  const handleUpload = async (files: FileList) => {
    if (!sellerProfile) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        const ext = file.name.split(".").pop();
        const path = `products/${sellerProfile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) { toast.error(`Upload échoué: ${error.message}`); continue; }
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setImageUrls([...imageUrls, ...urls]);
      if (urls.length > 0) toast.success(`${urls.length} image(s) ajoutée(s)`);
    } catch (e: any) {
      toast.error(e?.message || "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerProfile) return;
    if (!form.name || !form.price) { toast.error("Nom et prix requis"); return; }
    setSaving(true);

    const payload = {
      seller_id: sellerProfile.id,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      currency: "CDF",
      category: form.category || "Autre",
      image_urls: imageUrls,
      stock: form.stock ? parseInt(form.stock) : null,
      status: "pending", // Re-approve when edited
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from("products").update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq("id", editingProduct.id);
        if (error) throw error;
        toast.success("Produit mis à jour (en attente de validation)");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produit ajouté ! En attente de validation admin.");
      }
      resetForm();
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produit supprimé");
    fetchProducts();
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );

  // No seller profile yet
  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto pt-32 px-4 text-center">
          <Store className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-heading mb-2">Profil vendeur requis</h1>
          <p className="text-muted text-sm mb-6">Vous n'avez pas encore de profil vendeur. Créez-en un pour commencer à vendre.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-heading">{sellerProfile.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                sellerProfile.status === "active" ? "border-green-500/40 text-green-500" :
                sellerProfile.status === "pending" ? "border-yellow-500/40 text-yellow-500" :
                "border-red-500/40 text-red-500"
              }`}>
                {sellerProfile.status === "active" ? "Actif" : sellerProfile.status === "pending" ? "En attente" : "Suspendu"}
              </span>
              {isAdmin && <span className="text-xs text-accent font-semibold">Admin</span>}
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            disabled={sellerProfile.status !== "active"}
            className="px-4 h-11 rounded-lg bg-accent text-background font-semibold flex items-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Nouveau produit
          </button>
        </div>

        {sellerProfile.status !== "active" && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
            <p className="text-sm text-yellow-500">
              Votre compte vendeur est en attente de validation par l'admin. Vous pourrez ajouter des produits une fois approuvé.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "products" ? "bg-accent text-background" : "bg-surface text-muted"
            }`}
          >
            <Package className="h-4 w-4 inline mr-1.5" /> Produits ({products.length})
          </button>
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "profile" ? "bg-accent text-background" : "bg-surface text-muted"
            }`}
          >
            <Store className="h-4 w-4 inline mr-1.5" /> Profil
          </button>
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div>
            {products.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-surface-light">
                <Package className="h-12 w-12 text-muted mx-auto mb-3 opacity-50" />
                <p className="text-muted text-sm">Aucun produit. Cliquez sur "Nouveau produit".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-surface rounded-xl border border-surface-light overflow-hidden">
                    <div className="aspect-square bg-surface-light overflow-hidden">
                      {p.image_urls?.[0] ? (
                        <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-xs">Pas d'image</div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-heading line-clamp-1">{p.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                          p.status === "approved" ? "border-green-500/40 text-green-500" :
                          p.status === "pending" ? "border-yellow-500/40 text-yellow-500" :
                          "border-red-500/40 text-red-500"
                        }`}>
                          {p.status === "approved" ? "Validé" : p.status === "pending" ? "Attente" : "Rejeté"}
                        </span>
                      </div>
                      <p className="font-bold text-accent mt-1">{p.price.toLocaleString()} FC</p>
                      <p className="text-xs text-muted">{p.category}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="flex-1 h-9 rounded-lg bg-surface-light flex items-center justify-center gap-1 text-xs hover:bg-accent/20 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="h-9 px-3 rounded-lg bg-surface-light flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === "profile" && (
          <div className="max-w-lg">
            <div className="bg-surface rounded-xl border border-surface-light p-6 space-y-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Nom de boutique</label>
                <p className="text-heading font-medium">{sellerProfile.name}</p>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Email</label>
                <p className="text-heading">{sellerProfile.email || "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Téléphone</label>
                <p className="text-heading">{sellerProfile.phone || "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">WhatsApp</label>
                <p className="text-heading">{sellerProfile.whatsapp || "—"}</p>
              </div>
              {sellerProfile.bio && (
                <div>
                  <label className="text-xs text-muted mb-1 block">Bio</label>
                  <p className="text-muted text-sm">{sellerProfile.bio}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-muted mb-1 block">Statut</label>
                <p className={`text-sm font-semibold ${
                  sellerProfile.status === "active" ? "text-green-500" :
                  sellerProfile.status === "pending" ? "text-yellow-500" : "text-red-500"
                }`}>
                  {sellerProfile.status === "active" ? "✓ Actif" : sellerProfile.status === "pending" ? "⏳ En attente" : "✗ Suspendu"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-surface-light rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-heading">
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Nom du produit *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Chemise noire"
                  className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre produit..."
                  rows={3}
                  className="w-full bg-background border border-surface-light rounded-lg px-4 py-2 text-sm focus:border-accent outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Prix (FC) *</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    type="number"
                    placeholder="5000"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Stock</label>
                  <input
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    type="number"
                    placeholder="Illimité"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                >
                  <option value="">Choisir...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                  <option value="Autre">📦 Autre</option>
                </select>
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs text-muted mb-1 block">Images (max 5)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-light">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 w-5 h-5 bg-black/70 rounded-bl-lg flex items-center justify-center"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-surface-light flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Upload className="h-5 w-5 text-muted" />}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleUpload(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-lg bg-accent text-background font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> {editingProduct ? "Mettre à jour" : "Publier"}</>}
              </button>
              <p className="text-[10px] text-muted text-center">
                Tout produit est soumis à validation par l'admin avant d'être visible.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
