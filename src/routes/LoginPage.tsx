import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Store, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const { signIn, signUp, user, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(isAdmin ? "/admin" : "/vendeur");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Connexion réussie");
        navigate("/vendeur");
      } else {
        await signUp(email, password);
        toast.success("Compte créé ! Vérifiez votre email.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-surface-light rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <Store className="h-7 w-7 text-accent" />
              </div>
              <h1 className="font-display text-2xl font-bold text-heading">
                {mode === "login" ? "Connexion" : "Créer un compte"}
              </h1>
              <p className="text-sm text-muted mt-1">
                {mode === "login" ? "Espace vendeur & admin" : "Rejoignez YuuStore"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Mot de passe</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-accent text-background font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Se connecter" : "S'inscrire"}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-accent hover:underline"
              >
                {mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-surface-light">
              <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3" /> Connexion sécurisée via Supabase
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted mt-4">
            Client ? Pas besoin de compte — ajoutez au panier et commandez via WhatsApp.
          </p>
        </div>
      </main>
    </div>
  );
}
