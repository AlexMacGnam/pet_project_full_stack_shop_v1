import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function CartDropdown({ onClose }) {
  const { cart, totalPrice, changeQuantity, removeFromCart } = useCart();

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50">
      <div className="p-4">
        <h3 className="font-bold text-lg mb-3 text-slate-800">Cart</h3>
        {cart.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Cart is empty</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <li key={item.productId} className={`py-2 flex items-center gap-2 ${item.outOfStock ? "opacity-50" : ""}`}>
                  <span>{item.image}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    {item.outOfStock
                      ? <p className="text-xs text-red-500 font-medium">Out of stock</p>
                      : <p className="text-xs text-slate-400">{formatPrice(item.priceSnapshot)}</p>
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQuantity(item.productId, -1)} className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700">−</button>
                    <span className="text-sm w-4 text-center text-slate-800">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.productId, 1)} className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800">Total: {formatPrice(totalPrice)}</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/cart" onClick={onClose} className="block text-center bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition">View Cart</Link>
              <Link to="/checkout" onClick={onClose} className="block text-center bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition">Checkout</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
