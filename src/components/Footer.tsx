import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-light mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="font-display font-black text-background text-lg">Y</span>
              </div>
              <span className="font-display font-bold text-lg text-heading">YuuStore</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Le centre commercial dans votre poche. Achetez, vendez et commandez en toute simplicité.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-heading mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted hover:text-accent transition-colors">Accueil</Link></li>
              <li><Link to="/catalogue" className="text-sm text-muted hover:text-accent transition-colors">Catalogue</Link></li>
              <li><Link to="/vendeur/inscription" className="text-sm text-muted hover:text-accent transition-colors">Devenir vendeur</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-heading mb-3 text-sm">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0" /> Kinshasa, RDC
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <Phone className="h-4 w-4 shrink-0" /> +243 977 555 768
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4 shrink-0" /> yuustore169@gmail.com
              </li>
            </ul>
          </div>

          {/* CEO */}
          <div>
            <h4 className="font-display font-semibold text-heading mb-3 text-sm">Mot du CEO</h4>
            <p className="text-sm text-muted italic leading-relaxed">
              "Merci à tous nos clients et partenaires pour ce soutien infini."
            </p>
            <p className="text-sm text-accent font-semibold mt-2">Guy Muzongo</p>
            <p className="text-xs text-muted">CEO & Fondateur</p>
          </div>
        </div>

        <div className="border-t border-surface-light mt-8 pt-6 text-center">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} YuuStore Inc. All Rights Reserved. Designed by INSPIRE by YuuStore.
          </p>
        </div>
      </div>
    </footer>
  );
}
