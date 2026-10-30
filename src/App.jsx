import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster, toast, useToasterStore } from "react-hot-toast";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes";

const TOAST_LIMIT = 2;

function ToastLimiter() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen">
            <Navbar />
            <Toaster
              position="top-center"
              containerStyle={{ zIndex: 9999 }}
              toastOptions={{ duration: 2000 }}
            />
            <ToastLimiter />
            <AppRoutes />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
