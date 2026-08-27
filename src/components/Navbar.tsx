import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, Menu, X, User, Store } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { count, setIsOpen } = useCart();
  const { user, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: "Accueil" },
    { to: "/catalogue", label: "Catalogue" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-surface-light">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="font-display font-black text-background text-lg">Y</span>
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-heading">YuuStore</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-body text-default hover:text-accent transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/vendeur/inscription" className="text-sm font-body text-default hover:text-accent transition-colors flex items-center gap-1.5">
            <Store className="h-4 w-4" /> Devenir vendeur
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-10 h-10 rounded-lg bg-surface border border-surface-light flex items-center justify-center hover:border-accent transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-default" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-background text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          {/* User menu */}
          {user ? (
            <button
              onClick={() => navigate(isAdmin ? "/admin" : "/vendeur")}
              className="hidden sm:flex w-10 h-10 rounded-lg bg-surface border border-surface-light items-center justify-center hover:border-accent transition-colors"
            >
              <User className="h-5 w-5 text-default" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              Connexion
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-lg bg-surface border border-surface-light flex items-center justify-center"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-b border-surface-light animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-default hover:text-accent transition-colors py-2"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/vendeur/inscription" onClick={() => setMobileOpen(false)} className="block text-sm text-default hover:text-accent transition-colors py-2">
              Devenir vendeur
            </Link>
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); navigate(isAdmin ? "/admin" : "/vendeur"); }}
                className="block text-sm text-default hover:text-accent transition-colors py-2"
              >
                {isAdmin ? "Panneau Admin" : isSeller ? "Espace Vendeur" : "Mon compte"}
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate("/login"); }}
                className="block text-sm text-accent font-semibold py-2"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
