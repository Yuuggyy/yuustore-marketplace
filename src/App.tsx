import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import AppErrorBoundary from "./components/AppErrorBoundary";

import HomePage from "./routes/HomePage";
import CataloguePage from "./routes/CataloguePage";
import ProductDetailPage from "./routes/ProductDetailPage";
import LoginPage from "./routes/LoginPage";
import SellerDashboard from "./routes/SellerDashboard";
import AdminDashboard from "./routes/AdminDashboard";
import SellerRegisterPage from "./routes/SellerRegisterPage";

function ProtectedRoute({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (admin && !isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter basename="/yuustore-marketplace">
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#191919",
                  color: "#f8f8f8",
                  border: "1px solid #333",
                },
              }}
            />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/vendeur/inscription" element={<SellerRegisterPage />} />
              <Route path="/vendeur" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
