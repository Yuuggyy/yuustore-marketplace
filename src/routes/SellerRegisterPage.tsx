import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Store, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function SellerRegisterPage() {
  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"account" | "profile">("account");

  if (user) {
    navigate("/vendeur");
    return null;
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      await signUp(email, password);
      setStep("profile");
      toast.success("Compte créé ! Complétez votre profil vendeur.");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Entrez votre nom de vendeur"); return; }
    setLoading(true);
    try {
      // Sign in to get session
      await signIn(email, password);

      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;
      if (!userId) throw new Error("Session non trouvée");

      const { error } = await supabase.from("sellers").insert({
        user_id: userId,
        name: name.trim(),
        email,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        bio: bio.trim() || null,
        status: "pending", // Admin must approve
      });

      if (error) throw error;

      toast.success("Profil créé ! En attente de validation par l'admin.");
      navigate("/vendeur");
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
              <h1 className="font-display text-2xl font-bold text-heading">Devenir vendeur</h1>
              <p className="text-sm text-muted mt-1">
                {step === "account" ? "Créez votre compte vendeur" : "Complétez votre profil"}
              </p>
            </div>

            {step === "account" ? (
              <form onSubmit={handleCreateAccount} className="space-y-4">
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuer <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Nom de vendeur / Boutique *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Boutique Yugi"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Téléphone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="+243 8xx xxx xxx"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">WhatsApp</label>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    type="tel"
                    placeholder="+243 8xx xxx xxx"
                    className="w-full bg-background border border-surface-light rounded-lg px-4 h-11 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Bio / Description (optionnel)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Décrivez votre boutique..."
                    rows={3}
                    className="w-full bg-background border border-surface-light rounded-lg px-4 py-2 text-sm focus:border-accent outline-none resize-none"
                  />
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                  <p className="text-xs text-accent text-center">
                    ⏳ Votre compte vendeur sera validé par l'admin avant d'être actif.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-accent text-background font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon profil vendeur"}
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-muted hover:text-accent">
                Déjà un compte ? Se connecter
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
