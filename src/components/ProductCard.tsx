import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Product } from "@/lib/supabase";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-surface rounded-xl overflow-hidden border border-surface-light hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
        {/* Image */}
        <div className="aspect-square bg-surface-light overflow-hidden relative">
          {product.image_urls?.[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-xs">Pas d'image</span>
            </div>
          )}
          {product.image_urls?.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              +{product.image_urls.length - 1}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium text-heading line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-xs text-muted mt-1 line-clamp-1">{product.category}</p>

          {/* Price + Seller */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="font-display font-bold text-accent text-base">
                {product.price.toLocaleString()} <span className="text-xs text-muted">FC</span>
              </p>
            </div>
          </div>

          {/* Seller badge */}
          {product.seller_name && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-surface-light">
              <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                <Star className="h-2.5 w-2.5 text-accent" />
              </div>
              <span className="text-[10px] text-muted truncate">par {product.seller_name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
