import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function Cart({ onCheckout }) {
  const { cart, removeFromCart, changeQuantity, totalPrice } = useCart();

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-center text-slate-400">
        <p className="text-4xl mb-2">🛒</p>
        <p>Cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Cart</h2>
      <ul className="divide-y divide-slate-100">
        {cart.map((item) => (
          <li key={item.productId} className={`py-3 flex items-center gap-3 ${item.outOfStock ? "opacity-50" : ""}`}>
            <span className="text-2xl">{item.image}</span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.name}</p>
              {item.outOfStock
                ? <p className="text-xs text-red-500 font-medium">Out of stock</p>
                : <p className="text-sm text-slate-500">{formatPrice(item.priceSnapshot)}</p>
              }
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => changeQuantity(item.productId, -1)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">−</button>
              <span className="w-5 text-center text-slate-800">{item.quantity}</span>
              <button onClick={() => changeQuantity(item.productId, 1)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">+</button>
            </div>
            <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="font-bold text-lg text-slate-800">Total: {formatPrice(totalPrice)}</span>
        <button onClick={onCheckout} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition">Checkout</button>
      </div>
    </div>
  );
}
