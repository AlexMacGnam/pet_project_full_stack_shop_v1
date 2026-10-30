import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/orders";
import { getProducts } from "../api/products";
import { createPaymentSession } from "../api/payments";
import { formatPrice } from "../utils/format";

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, cartId } = useCart();
  const { user } = useAuth();
  const [payMode, setPayMode] = useState("now");
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [priceChanges, setPriceChanges] = useState([]);
  const [actualTotal, setActualTotal] = useState(null);

  useEffect(() => {
    getProducts()
      .then((products) => {
        const changes = cart
          .filter((item) => {
            const current = products.find((p) => p.id === item.productId);
            return current && current.price !== item.priceSnapshot;
          })
          .map((item) => {
            const current = products.find((p) => p.id === item.productId);
            return { name: item.name, old: item.priceSnapshot, new: current.price };
          });
        setPriceChanges(changes);
        const recalculated = cart.reduce((sum, item) => {
          const current = products.find((p) => p.id === item.productId);
          return sum + (current ? current.price : item.priceSnapshot) * item.quantity;
        }, 0);
        if (recalculated !== totalPrice) setActualTotal(recalculated);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!user && payMode === "now") {
      setError("Please log in to pay now.");
      setLoading(false);
      return;
    }
    try {
      const order = await createOrder({
        name: user ? user.name : form.name,
        email: user ? user.email : form.email,
        address: form.address,
        items: cart,
        totalPrice,
        cartId,
      });
      if (!user) {
        const saved = JSON.parse(localStorage.getItem("guestOrders") || "[]");
        localStorage.setItem("guestOrders", JSON.stringify([...saved, order]));
      }
      if (payMode === "now") {
        const { url } = await createPaymentSession(order.id, couponCode || undefined);
        window.location.href = url;
      } else {
        clearCart();
        navigate("/orders");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Checkout</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold mb-3 text-slate-800">Order Summary</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {cart.map((item) => (
            <li key={item.productId} className="py-2 flex justify-between text-slate-700">
              <span>{item.image} {item.name} × {item.quantity}</span>
              <span>{formatPrice(item.priceSnapshot * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-slate-100 font-bold flex justify-between items-start text-slate-800">
          <span>Total</span>
          <div className="text-right">
            {actualTotal ? (
              <>
                <p className="line-through text-slate-400 text-sm font-normal">{formatPrice(totalPrice)}</p>
                <p>{formatPrice(actualTotal)}</p>
                <p className="text-xs text-orange-500 font-normal">Recalculated at current prices</p>
              </>
            ) : (
              <span>{formatPrice(totalPrice)}</span>
            )}
          </div>
        </div>
      </div>

      {priceChanges.length > 0 && (
        <div className="mb-4 bg-orange-50 text-orange-700 px-4 py-3 rounded-lg text-sm border border-orange-100">
          <p className="font-semibold mb-1">Price changed since you added to cart:</p>
          {priceChanges.map((c) => (
            <p key={c.name}>{c.name}: {formatPrice(c.old)} → {formatPrice(c.new)}</p>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
        {user ? (
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
            <p><span className="font-medium text-slate-700">Name:</span> {user.name}</p>
            <p><span className="font-medium text-slate-700">Email:</span> {user.email}</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="w-full border border-slate-200 text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Your email"
                className="w-full border border-slate-200 text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Promo Code</label>
          <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter promo code"
            className="w-full border border-slate-200 text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Delivery Address</label>
          <input type="text" required value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Your address"
            className="w-full border border-slate-200 text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg transition">
            Back
          </button>
          <button type="submit" onClick={() => setPayMode("now")} disabled={loading || cart.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg transition">
            {loading && payMode === "now" ? "Redirecting..." : "Pay Now"}
          </button>
          {user && (
            <button type="submit" onClick={() => setPayMode("later")} disabled={loading || cart.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg transition">
              {loading && payMode === "later" ? "Placing..." : "Pay Later"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
