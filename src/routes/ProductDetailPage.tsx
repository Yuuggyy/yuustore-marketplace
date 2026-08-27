import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Star, Plus, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { supabase, type Product } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from("products")
        .select("*, sellers(name, phone, whatsapp)")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        const seller = (data as any).sellers;
        setProduct({
          ...data,
          seller_name: seller?.name,
        } as Product);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      seller_id: product.seller_id,
      seller_name: product.seller_name || "Vendeur",
      image_url: product.image_urls?.[0],
    }, quantity);
    toast.success("Ajouté au panier !");
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted">Produit introuvable</p>
        <Link to="/catalogue" className="text-accent font-semibold">← Retour au catalogue</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-xl bg-surface border border-surface-light overflow-hidden">
              {product.image_urls?.[activeImage] ? (
                <img src={product.image_urls[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">Pas d'image</div>
              )}
            </div>
            {product.image_urls?.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                      i === activeImage ? "border-accent" : "border-surface-light"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span className="text-xs text-accent font-medium uppercase tracking-wider">{product.category}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-heading mt-2">{product.name}</h1>

            <p className="font-display text-3xl font-bold text-accent mt-4">
              {product.price.toLocaleString()} <span className="text-lg text-muted">FC</span>
            </p>

            {product.description && (
              <p className="text-muted text-sm mt-4 leading-relaxed">{product.description}</p>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm border-b border-surface-light pb-2">
                    <span className="text-muted">{key}</span>
                    <span className="text-heading">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Seller */}
            <div className="mt-6 bg-surface rounded-xl p-4 border border-surface-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-heading">{product.seller_name || "Vendeur YuuStore"}</p>
                  <p className="text-xs text-muted">Vendeur sur YuuStore</p>
                </div>
              </div>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex gap-3 mt-6">
              <div className="flex items-center bg-surface border border-surface-light rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-surface-light rounded-l-lg"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-12 flex items-center justify-center hover:bg-surface-light rounded-r-lg"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-lg bg-accent text-background font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors"
              >
                <ShoppingBag className="h-5 w-5" /> Ajouter au panier
              </button>
            </div>

            {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-red-400 mt-2">Plus que {product.stock} en stock !</p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
