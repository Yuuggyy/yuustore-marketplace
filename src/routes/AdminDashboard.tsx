import { useEffect, useState, useCallback } from "react";
import { Loader2, Package, Store, Inbox, Settings, Trash2, Check, X, MessageCircle, Upload, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase, type Product, type Seller, type Order, type Category } from "@/lib/supabase";
import { toast } from "sonner";

type Tab = "orders" | "products" | "sellers" | "categories" | "settings";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes, sellersRes, catsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*, sellers(name)").order("created_at", { ascending: false }),
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setOrders(ordersRes.data as Order[] || []);
    setProducts((productsRes.data || []).map((p: any) => ({ ...p, seller_name: p.sellers?.name })) as Product[]);
    setSellers(sellersRes.data as Seller[] || []);
    setCategories(catsRes.data as Category[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Product management
  const approveProduct = async (id: string) => {
    const { error } = await supabase.from("products").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produit approuvé");
    fetchAll();
  };

  const rejectProduct = async (id: string) => {
    const { error } = await supabase.from("products").update({ status: "rejected" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produit rejeté");
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produit supprimé");
    fetchAll();
  };

  // Seller management
  const updateSellerStatus = async (id: string, status: Seller["status"]) => {
    const { error } = await supabase.from("sellers").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Vendeur activé" : status === "suspended" ? "Vendeur suspendu" : "Statut mis à jour");
    fetchAll();
  };

  // Order management
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour");
    fetchAll();
  };

  // Category management
  const [newCat, setNewCat] = useState({ name: "", icon: "📦" });
  const addCategory = async () => {
    if (!newCat.name.trim()) return;
    const { error } = await supabase.from("categories").insert({
      name: newCat.name.trim(),
      icon: newCat.icon,
      sort_order: categories.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Catégorie ajoutée");
    setNewCat({ name: "", icon: "📦" });
    fetchAll();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Catégorie supprimée");
    fetchAll();
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );

  const pendingProducts = products.filter(p => p.status === "pending");
  const pendingSellers = sellers.filter(s => s.status === "pending");
  const newOrders = orders.filter(o => o.status === "new");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <h1 className="font-display text-3xl font-bold text-heading mb-2">Panneau d'administration</h1>
        <p className="text-muted text-sm mb-6">Gérez la marketplace YuuStore</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface border border-surface-light rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Commandes</p>
            <p className="text-2xl font-bold text-heading mt-1">{newOrders.length}<span className="text-sm text-muted"> nouvelles</span></p>
          </div>
          <div className="bg-surface border border-yellow-500/30 rounded-xl p-4">
            <p className="text-xs text-yellow-500 uppercase tracking-wider">Produits en attente</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{pendingProducts.length}</p>
          </div>
          <div className="bg-surface border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs text-blue-500 uppercase tracking-wider">Vendeurs en attente</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{pendingSellers.length}</p>
          </div>
          <div className="bg-surface border border-accent/30 rounded-xl p-4">
            <p className="text-xs text-accent uppercase tracking-wider">Vendeurs actifs</p>
            <p className="text-2xl font-bold text-accent mt-1">{sellers.filter(s => s.status === "active").length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {[
            { id: "orders" as Tab, label: "Commandes", icon: <Inbox className="h-4 w-4" />, badge: newOrders.length },
            { id: "products" as Tab, label: "Produits", icon: <Package className="h-4 w-4" />, badge: pendingProducts.length },
            { id: "sellers" as Tab, label: "Vendeurs", icon: <Store className="h-4 w-4" />, badge: pendingSellers.length },
            { id: "categories" as Tab, label: "Catégories", icon: <Package className="h-4 w-4" /> },
            { id: "settings" as Tab, label: "Apparence", icon: <Settings className="h-4 w-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 transition-colors ${
                tab === t.id ? "bg-accent text-background" : "bg-surface text-muted"
              }`}
            >
              {t.icon} {t.label}
              {t.badge ? <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 && <p className="text-muted text-sm">Aucune commande.</p>}
            {orders.map((o) => (
              <div key={o.id} className="bg-surface border border-surface-light rounded-xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-heading">{o.client_name || "Client"}</p>
                    <p className="text-xs text-muted">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
                    <p className="text-sm mt-1">WhatsApp: <span className="font-mono text-accent">{o.client_whatsapp}</span></p>
                    {o.notes && <p className="text-xs text-muted italic mt-1">Note: {o.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase px-2 py-1 rounded border ${
                      o.status === "new" ? "border-accent/40 text-accent" :
                      o.status === "contacted" ? "border-blue-500/40 text-blue-500" :
                      o.status === "delivered" ? "border-green-500/40 text-green-500" :
                      "border-red-500/40 text-red-500"
                    }`}>{o.status}</span>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="h-8 rounded-md border border-surface-light bg-background px-2 text-xs"
                    >
                      <option value="new">Nouvelle</option>
                      <option value="contacted">Contacté</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-surface-light pb-1">
                      <div>
                        <span className="text-heading">{item.quantity}× {item.product_name}</span>
                        <span className="text-muted text-xs ml-2">par {item.seller_name}</span>
                      </div>
                      <span className="text-accent font-semibold">{(item.price * item.quantity).toLocaleString()} FC</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2">
                    <span className="text-heading">Total</span>
                    <span className="text-accent">{o.total.toLocaleString()} FC</span>
                  </div>
                </div>
                {/* WhatsApp contact */}
                <a
                  href={`https://wa.me/${o.client_whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Bonjour ${o.client_name || ""}, YuuStore au sujet de votre commande...`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-medium hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Products tab */}
        {tab === "products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-surface border border-surface-light rounded-xl overflow-hidden">
                <div className="aspect-square bg-surface-light overflow-hidden">
                  {p.image_urls?.[0] ? (
                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">Pas d'image</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-heading line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted">par {p.seller_name || "—"}</p>
                  <p className="font-bold text-accent text-sm mt-1">{p.price.toLocaleString()} FC</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block mt-1 ${
                    p.status === "approved" ? "border-green-500/40 text-green-500" :
                    p.status === "pending" ? "border-yellow-500/40 text-yellow-500" :
                    "border-red-500/40 text-red-500"
                  }`}>{p.status}</span>
                  <div className="flex gap-1 mt-2">
                    {p.status !== "approved" && (
                      <button onClick={() => approveProduct(p.id)} className="flex-1 h-8 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-xs flex items-center justify-center gap-1 hover:bg-green-500/20">
                        <Check className="h-3 w-3" /> Valider
                      </button>
                    )}
                    {p.status !== "rejected" && (
                      <button onClick={() => rejectProduct(p.id)} className="flex-1 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs flex items-center justify-center gap-1 hover:bg-yellow-500/20">
                        <X className="h-3 w-3" /> Rejeter
                      </button>
                    )}
                    <button onClick={() => deleteProduct(p.id)} className="h-8 px-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sellers tab */}
        {tab === "sellers" && (
          <div className="space-y-3">
            {sellers.map((s) => (
              <div key={s.id} className="bg-surface border border-surface-light rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-heading">{s.name}</p>
                  <p className="text-xs text-muted">{s.email} • {s.phone || "Pas de tél"}</p>
                  <p className="text-xs text-muted">{s.whatsapp || "Pas de WhatsApp"}</p>
                  <p className="text-[10px] text-muted mt-1">Inscrit le {new Date(s.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    s.status === "active" ? "border-green-500/40 text-green-500" :
                    s.status === "pending" ? "border-yellow-500/40 text-yellow-500" :
                    "border-red-500/40 text-red-500"
                  }`}>{s.status}</span>
                  <select
                    value={s.status}
                    onChange={(e) => updateSellerStatus(s.id, e.target.value as Seller["status"])}
                    className="h-8 rounded-md border border-surface-light bg-background px-2 text-xs"
                  >
                    <option value="pending">En attente</option>
                    <option value="active">Actif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </div>
            ))}
            {sellers.length === 0 && <p className="text-muted text-sm">Aucun vendeur inscrit.</p>}
          </div>
        )}

        {/* Categories tab */}
        {tab === "categories" && (
          <div className="max-w-lg space-y-4">
            <div className="flex gap-2">
              <input
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-16 bg-surface border border-surface-light rounded-lg px-3 h-10 text-center text-lg"
                maxLength={2}
              />
              <input
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="Nom de catégorie"
                className="flex-1 bg-surface border border-surface-light rounded-lg px-4 h-10 text-sm focus:border-accent outline-none"
              />
              <button onClick={addCategory} className="px-4 h-10 rounded-lg bg-accent text-background font-semibold text-sm">
                Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-surface border border-surface-light rounded-lg px-4 py-3">
                  <span className="text-heading"><span className="text-lg mr-2">{c.icon}</span>{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-muted text-sm">Aucune catégorie.</p>}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="max-w-lg space-y-4">
            <div className="bg-surface border border-surface-light rounded-xl p-6">
              <h3 className="font-display font-semibold text-heading mb-2 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-accent" /> Photos du site
              </h3>
              <p className="text-xs text-muted mb-4">Gérez les images principales du site (hero, logo, etc.)</p>
              <SiteImageUploader label="Logo du site" settingKey="site_logo" />
              <SiteImageUploader label="Image Hero (page d'accueil)" settingKey="hero_image" />
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-6">
              <h3 className="font-display font-semibold text-heading mb-2">Informations</h3>
              <p className="text-xs text-muted">WhatsApp: +243 901 950 256</p>
              <p className="text-xs text-muted">Email: yuustore169@gmail.com</p>
              <p className="text-xs text-muted">Localisation: Kinshasa, RDC</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SiteImageUploader({ label, settingKey }: { label: string; settingKey: string }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", settingKey).maybeSingle();
      if (data) setCurrentUrl(data.value);
    })();
  }, [settingKey]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `site/${settingKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = data.publicUrl;
      setCurrentUrl(url);
      await supabase.from("site_settings").upsert({ key: settingKey, value: url }, { onConflict: "key" });
      toast.success("Image mise à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4 last:mb-0">
      <label className="text-xs text-muted mb-2 block">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-lg bg-surface-light border border-surface-light overflow-hidden flex items-center justify-center">
          {currentUrl ? <img src={currentUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted" />}
        </div>
        <label className="px-4 h-10 rounded-lg bg-surface-light border border-surface-light flex items-center gap-2 text-sm cursor-pointer hover:border-accent transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Upload..." : "Changer"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
