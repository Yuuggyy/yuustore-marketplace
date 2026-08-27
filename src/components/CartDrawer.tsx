import { useState } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, Send, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CartDrawer() {
  const { items, total, count, isOpen, setIsOpen, removeItem, updateQuantity, clearCart } = useCart();
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error("Votre panier est vide"); return; }
    if (!whatsapp.trim()) { toast.error("Entrez votre numéro WhatsApp"); return; }

    setSubmitting(true);
    try {
      // Create order in Supabase
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        product_name: i.name,
        seller_id: i.seller_id,
        seller_name: i.seller_name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      }));

      const { error } = await supabase.from("orders").insert({
        client_name: name.trim() || null,
        client_whatsapp: whatsapp.trim(),
        items: orderItems,
        total,
        currency: "CDF",
        status: "new",
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.success("Commande envoyée ! Nous vous contacterons sur WhatsApp.");
      clearCart();
      setWhatsapp("");
      setName("");
      setNotes("");
      setIsOpen(false);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message || "réessayez"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-background border-l border-surface-light h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-surface-light shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <span className="font-display font-semibold text-heading">Mon Panier ({count})</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-surface-light">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-20">
              <ShoppingBag className="h-12 w-12 text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted text-sm">Votre panier est vide</p>
              <button onClick={() => setIsOpen(false)} className="mt-4 text-accent text-sm font-semibold">
                Parcourir le catalogue →
              </button>
            </div>
          )}

          {items.map((item) => (
            <div key={item.product_id} className="bg-surface rounded-xl p-3 flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-surface-light overflow-hidden shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-heading truncate">{item.name}</p>
                <p className="text-xs text-muted">par {item.seller_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-surface-light flex items-center justify-center hover:bg-accent/20"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded bg-surface-light flex items-center justify-center hover:bg-accent/20"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-accent">{(item.price * item.quantity).toLocaleString()} FC</span>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="w-7 h-7 rounded bg-surface-light flex items-center justify-center hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        {items.length > 0 && (
          <div className="border-t border-surface-light p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="font-display font-bold text-xl text-accent">{total.toLocaleString()} FC</span>
            </div>

            {/* WhatsApp number (required) */}
            <div>
              <label className="text-xs text-muted mb-1 block">Numéro WhatsApp *</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+243 8xx xxx xxx"
                type="tel"
                className="w-full bg-surface border border-surface-light rounded-lg px-3 h-10 text-sm focus:border-accent outline-none"
              />
            </div>

            {/* Name (optional) */}
            <div>
              <label className="text-xs text-muted mb-1 block">Nom (optionnel)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full bg-surface border border-surface-light rounded-lg px-3 h-10 text-sm focus:border-accent outline-none"
              />
            </div>

            {/* Notes (optional) */}
            <div>
              <label className="text-xs text-muted mb-1 block">Message / Taille / Préférence (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Taille M, couleur noire..."
                rows={2}
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-sm focus:border-accent outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-accent text-background font-bold text-sm hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
              ) : (
                <><Send className="h-4 w-4" /> Commander via WhatsApp</>
              )}
            </button>

            <p className="text-[10px] text-muted text-center">
              Nous recevons votre commande et vous contactons sur WhatsApp pour la livraison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
