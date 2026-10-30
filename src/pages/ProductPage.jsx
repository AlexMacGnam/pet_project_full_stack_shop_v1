import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct } from "../api/products";
import { getProductReviews } from "../api/reviews";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

function StarRating({ avg, size = "text-lg" }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = star <= Math.floor(avg);
        const half = !full && star <= Math.ceil(avg) && avg % 1 >= 0.25;
        return (
          <span
            key={star}
            className={`relative inline-block text-slate-200 ${size} leading-none`}
          >
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
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProduct(Number(id)), getProductReviews(Number(id))])
      .then(([prod, { reviews: revs, averageRating: avg }]) => {
        setProduct(prod);
        setReviews(revs);
        setAverageRating(avg);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <p className="text-center py-8 text-slate-400">Loading...</p>;
  if (!product) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-500 hover:text-indigo-500 mb-6 flex items-center gap-1 transition"
      >
        ← Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex flex-col items-center gap-4 mb-6">
        <span className="text-7xl">{product.medias?.[0]}</span>
        <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>

        <div className="flex items-center gap-2">
          {averageRating ? (
            <>
              <StarRating avg={averageRating} size="text-xl" />
              <span className="text-slate-500 text-sm">
                {averageRating} ({reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span className="text-slate-400 text-sm">No reviews yet</span>
          )}
        </div>

        <p className="text-2xl font-bold text-indigo-600">
          {formatPrice(product.price)}
        </p>

        {product.amount === 0 ? (
          <button
            disabled
            className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <>
            {product.amount <= 5 && (
              <p className="text-sm text-orange-500">
                Only {product.amount} left
              </p>
            )}
            <button
              onClick={() => addToCart(product)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl transition font-medium"
            >
              Add to Cart
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No reviews yet. Be the first!
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {reviews.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {review.userName}
                    </p>
                    <StarRating avg={review.rating} size="text-sm" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 mt-2">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
