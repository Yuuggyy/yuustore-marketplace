import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  seller_id: string;
  seller_name: string;
  image_url?: string;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setIsOpen(true);
  };

  const removeItem = (product_id: string) =>
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));

  const updateQuantity = (product_id: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.product_id === product_id ? { ...i, quantity: Math.max(1, qty) } : i))
    );

  const clearCart = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <Ctx.Provider value={{ items, total, count, addItem, removeItem, updateQuantity, clearCart, isOpen, setIsOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
