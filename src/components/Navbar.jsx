import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDropdown from "./CartDropdown";

export default function Navbar() {
  const { cart } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar-gradient border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] tracking-wide"
        >
          Lazada from Temu
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/orders"
            className="text-gray-300 hover:text-indigo-400 transition"
          >
            Orders
          </Link>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-gray-300 hover:text-indigo-400 transition"
            >
              Admin Panel
            </Link>
          )}

          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-300 hover:text-indigo-400 transition"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-400">
                {user.name[0].toUpperCase()}
              </div>
              <span className="text-sm">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-gray-300 hover:text-indigo-400 transition text-sm"
            >
              Sign In
            </Link>
          )}

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="relative p-3 rounded-full bg-white hover:bg-white/90 transition"
            >
              <span className="text-2xl">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>

            {open && <CartDropdown onClose={() => setOpen(false)} />}
          </div>
        </div>
      </div>
    </nav>
  );
}
