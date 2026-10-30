import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Pagination from "./Pagination";
import { formatPrice } from "../utils/format";
import { getAllRatings } from "../api/reviews";

const ITEMS_PER_PAGE = 9;

function StarRating({ avg, total }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const full = star <= Math.floor(avg);
          const half = !full && star <= Math.ceil(avg) && avg % 1 >= 0.25;
          return (
            <span key={star} className="relative inline-block text-slate-200 text-sm leading-none">
              ★
              {(full || half) && (
                <span
                  className="absolute inset-0 overflow-hidden text-yellow-400"
                  style={{ width: full ? "100%" : "50%" }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-slate-400 text-xs">({total})</span>
    </div>
  );
}

export default function ProductList({ products = [] }) {
  const { addToCart } = useCart();
  const [page, setPage] = useState(1);
  const [ratings, setRatings] = useState({});

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentItems = products.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [products]);

  useEffect(() => {
    getAllRatings().then(setRatings).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-3 hover:shadow-md transition"
          >
            <Link to={`/products/${product.id}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition">
              <span className="text-5xl">{product.medias?.[0]}</span>
              <h3 className="font-semibold text-lg text-slate-800">{product.name}</h3>
            </Link>
            <p className="text-slate-500">{formatPrice(product.price)}</p>
            <div className="w-full flex justify-between items-center text-xs h-4">
              <p className="text-orange-500">
                {product.amount > 0 && product.amount <= 5 ? `Only ${product.amount} left` : ""}
              </p>
              {ratings[product.id] ? (
                <StarRating avg={ratings[product.id].avg} total={ratings[product.id].total} />
              ) : (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-200 text-sm">★★★★★</span>
                  <span className="text-slate-400">No reviews yet</span>
                </div>
              )}
            </div>
            {product.amount === 0 ? (
              <button disabled className="w-full bg-slate-100 text-slate-400 py-2 rounded-lg cursor-not-allowed">
                Out of Stock
              </button>
            ) : (
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
              >
                Add to Cart
              </button>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-slate-400 mt-10">No products found</p>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
