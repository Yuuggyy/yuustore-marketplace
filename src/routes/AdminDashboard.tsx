import { useEffect, useState, useCallback } from "react";
import { Loader2, Package, Store, Inbox, Settings, Trash2, Check, X, MessageCircle, Upload, Image as ImageIcon, Plus } from "lucide-react";
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

  // Admin product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [adminProduct, setAdminProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    stock: "",
  });
  const [addingProduct, setAddingProduct] = useState(false);

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

  // Admin add product (admin creates as a special seller or without seller)
  const addAdminProduct = async () => {
    if (!adminProduct.name.trim() || !adminProduct.price.trim()) {
      toast.error("Nom et prix requis");
      return;
    }
    setAddingProduct(true);
    try {
      // Check if an admin seller exists, if not create one
      let adminSellerId: string | null = null;
      const { data: existingSeller } = await supabase
        .from("sellers")
        .select("id")
        .eq("email", "yuustore169@gmail.com")
        .maybeSingle();

      if (existingSeller) {
        adminSellerId = existingSeller.id;
      } else {
        const { data: newSeller, error: sellerError } = await supabase.from("sellers").insert({
          name: "YuuStore Officiel",
          email: "yuustore169@gmail.com",
          status: "active",
        }).select().single();
        if (sellerError) throw sellerError;
        adminSellerId = newSeller.id;
      }

      const imageUrls = adminProduct.image_url ? [adminProduct.image_url] : [];

      const { error } = await supabase.from("products").insert({
        seller_id: adminSellerId,
        name: adminProduct.name.trim(),
        description: adminProduct.description || null,
        price: parseFloat(adminProduct.price),
        category: adminProduct.category || null,
        image_urls: imageUrls,
        stock: adminProduct.stock ? parseInt(adminProduct.stock) : null,
        status: "approved", // Admin products are auto-approved
      });

      if (error) throw error;
      toast.success("Produit ajouté par l'admin");
      setAdminProduct({ name: "", description: "", price: "", category: "", image_url: "", stock: "" });
      setShowAddProduct(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'ajout");
    }
    setAddingProduct(false);
  };

  // Upload product image
  const uploadProductImage = async (file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `admin/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setAdminProduct({ ...adminProduct, image_url: urlData.publicUrl });
      toast.success("Image ajoutée");
    } catch (e: any) {
      toast.error(e.message || "Erreur upload");
    }
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
  const [newCat, setNewCat] = useState({ name: "", icon: "" });
  const addCategory = async () => {
    if (!newCat.name.trim()) return;
    const { error } = await supabase.from("categories").insert({
      name: newCat.name.trim(),
      icon: newCat.icon,
      sort_order: categories.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Catégorie ajoutée");
    setNewCat({ name: "", icon: "" });
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
            {orders.length === 0 && (
              <div className="bg-surface border border-surface-light rounded-xl p-8 text-center">
                <Inbox className="h-10 w-10 text-muted mx-auto mb-3 opacity-50" />
                <p className="text-muted text-sm">Aucune commande pour le moment.</p>
                <p className="text-muted text-xs mt-1">Les commandes des clients apparaîtront ici automatiquement.</p>
              </div>
            )}
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
                        <span className="text-heading">{item.quantity}x {item.product_name}</span>
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
          <div>
            {/* Add product button + form */}
            <div className="mb-4">
              {!showAddProduct ? (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-accent text-background font-semibold text-sm hover:bg-accent/90 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Ajouter un produit
                </button>
              ) : (
                <div className="bg-surface border border-surface-light rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-heading">Nouveau produit (Admin)</h3>
                    <button onClick={() => setShowAddProduct(false)} className="text-muted hover:text-heading p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <input
                    value={adminProduct.name}
                    onChange={(e) => setAdminProduct({ ...adminProduct, name: e.target.value })}
                    placeholder="Nom du produit *"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-10 text-sm focus:border-accent outline-none"
                  />
                  <textarea
                    value={adminProduct.description}
                    onChange={(e) => setAdminProduct({ ...adminProduct, description: e.target.value })}
                    placeholder="Description (optionnel)"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 py-2 text-sm focus:border-accent outline-none min-h-[60px]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={adminProduct.price}
                      onChange={(e) => setAdminProduct({ ...adminProduct, price: e.target.value })}
                      placeholder="Prix (FC) *"
                      type="number"
                      className="bg-background border border-surface-light rounded-lg px-4 h-10 text-sm focus:border-accent outline-none"
                    />
                    <input
                      value={adminProduct.stock}
                      onChange={(e) => setAdminProduct({ ...adminProduct, stock: e.target.value })}
                      placeholder="Stock (optionnel)"
                      type="number"
                      className="bg-background border border-surface-light rounded-lg px-4 h-10 text-sm focus:border-accent outline-none"
                    />
                  </div>
                  <select
                    value={adminProduct.category}
                    onChange={(e) => setAdminProduct({ ...adminProduct, category: e.target.value })}
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-10 text-sm focus:border-accent outline-none"
                  >
                    <option value="">Catégorie (optionnel)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {/* Image upload */}
                  <div>
                    <label className="block text-xs text-muted mb-1">Image du produit</label>
                    {adminProduct.image_url ? (
                      <div className="relative">
                        <img src={adminProduct.image_url} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-surface-light" />
                        <button
                          onClick={() => setAdminProduct({ ...adminProduct, image_url: "" })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-surface-light text-muted text-sm cursor-pointer hover:border-accent transition-colors">
                        <Upload className="h-4 w-4" /> Téléverser une image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadProductImage(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <button
                    onClick={addAdminProduct}
                    disabled={addingProduct}
                    className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-accent text-background font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {addingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {addingProduct ? "Ajout..." : "Publier le produit"}
                  </button>
                </div>
              )}
            </div>

            {/* Products grid */}
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
                    <p className="text-xs text-muted">par {p.seller_name || "YuuStore"}</p>
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
              {products.length === 0 && (
                <p className="text-muted text-sm col-span-full text-center py-8">Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.</p>
              )}
            </div>
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
                  <span className="text-heading">{c.name}</span>
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
              <p className="text-xs text-muted">WhatsApp: +243 977 555 768</p>
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
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = urlData.publicUrl;
      const { error: dbError } = await supabase.from("site_settings").upsert({
        key: settingKey,
        value: url,
      }, { onConflict: "key" });
      if (dbError) throw dbError;
      setCurrentUrl(url);
      toast.success("Image mise à jour");
    } catch (e: any) {
      toast.error(e.message || "Erreur upload");
    }
    setUploading(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs text-muted mb-1">{label}</label>
      {currentUrl ? (
        <div className="relative inline-block">
          <img src={currentUrl} alt={label} className="w-32 h-32 object-cover rounded-lg border border-surface-light" />
          <label className="mt-2 flex items-center justify-center gap-2 h-8 rounded-lg border border-surface-light text-muted text-xs cursor-pointer hover:border-accent transition-colors">
            <Upload className="h-3 w-3" /> Remplacer
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
          </label>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-surface-light text-muted text-sm cursor-pointer hover:border-accent transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Upload..." : "Téléverser une image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </label>
      )}
    </div>
  );
}
