import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { getOrders } from "../api/orders";
import { createPaymentSession, getInvoice } from "../api/payments";
import { createReport, getReports } from "../api/reports";
import { createReview, updateReview, deleteReview, getMyReviews } from "../api/reviews";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportModal, setReportModal] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [couponCodes, setCouponCodes] = useState({});
  const [reports, setReports] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const location = useLocation();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!user) {
      const guestOrders = JSON.parse(localStorage.getItem("guestOrders") || "[]");
      setOrders(guestOrders);
      setLoading(false);
      return;
    }
    getOrders().then((data) => setOrders(data)).catch(() => setError("Failed to load orders")).finally(() => setLoading(false));
    getReports().then((data) => setReports(data)).catch(() => {});
    getMyReviews().then((data) => setMyReviews(data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "success") { clearCart(); toast.success("Payment successful!"); }
    if (params.get("payment") === "cancelled") toast.error("Payment cancelled");
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    const socket = io("http://localhost:3001", { auth: { token } });
    socket.on("order:paid", ({ orderId }) => {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, paymentStatus: "paid" } : o));
    });
    return () => socket.disconnect();
  }, [user]);

  async function handleSubmitReport(e) {
    e.preventDefault();
    try {
      await createReport({ orderId: reportModal, reason: reportReason, description: reportDescription });
      toast.success("Report submitted");
      setReportModal(null);
      setReportReason("");
      setReportDescription("");
      getReports().then((data) => setReports(data)).catch(() => {});
      getOrders().then((data) => setOrders(data)).catch(() => {});
    } catch (err) {
      toast.error(err.message || "Failed to submit report");
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (reviewRating === 0) return toast.error("Please select a rating");
    try {
      if (reviewModal.isEdit) {
        const updated = await updateReview(reviewModal.reviewId, { rating: reviewRating, comment: reviewComment });
        setMyReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r));
        toast.success("Review updated!");
      } else {
        const review = await createReview({ productId: reviewModal.productId, orderId: reviewModal.orderId, rating: reviewRating, comment: reviewComment });
        setMyReviews((prev) => [...prev, review]);
        toast.success("Review submitted!");
      }
      setReviewModal(null);
      setReviewRating(0);
      setReviewComment("");
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await deleteReview(reviewId);
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
    }
  }

  async function handleDownloadInvoice(orderId) {
    try {
      const { url } = await getInvoice(orderId);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err.message || "Failed to get invoice");
    }
  }

  async function handlePayNow(orderId) {
    try {
      const { url } = await createPaymentSession(orderId, couponCodes[orderId]);
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment");
    }
  }

  if (loading) return <p className="text-center py-8 text-slate-400">Loading...</p>;
  if (error) return <p className="text-center py-8 text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <p className="text-4xl mb-2">📋</p>
          <p>No orders yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => {
            const isExpired = order.expiresAt && new Date() > new Date(order.expiresAt);
            const canPay = order.paymentStatus === "unpaid" && !isExpired;

            return (
              <li key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-slate-800">Order #{order.id}</p>
                    <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{order.status}</span>
                    {order.paymentStatus && (() => {
                      const statusMap = {
                        paid: { label: "Paid", cls: "bg-indigo-100 text-indigo-700" },
                        refunding: { label: "Refunding...", cls: "bg-purple-100 text-purple-700" },
                        refunded: { label: "Refunded", cls: "bg-slate-100 text-slate-600" },
                        unpaid: { label: isExpired ? "Expired" : "Unpaid", cls: isExpired ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700" },
                      };
                      const s = statusMap[order.paymentStatus] ?? statusMap.unpaid;
                      return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.cls}`}>{s.label}</span>;
                    })()}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">👤 {order.name}</p>
                <p className="text-sm text-slate-600 mb-1">✉️ {order.email}</p>
                <p className="text-sm text-slate-600 mb-3">📍 {order.address}</p>
                <ul className="text-sm divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const existingReview = myReviews.find((r) => r.productId === item.productId);
                    return (
                      <li key={item.productId} className="py-2 flex justify-between items-center text-slate-700">
                        <span>{item.image} {item.name} × {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{formatPrice((item.priceSnapshot ?? item.price) * item.quantity)}</span>
                          {order.paymentStatus === "paid" && (
                            existingReview ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 font-medium">✓</span>
                                <button
                                  onClick={() => { setReviewModal({ isEdit: true, reviewId: existingReview.id, productId: item.productId, productName: item.name }); setReviewRating(existingReview.rating); setReviewComment(existingReview.comment); }}
                                  className="text-xs text-indigo-600 hover:bg-indigo-50 font-medium px-2 py-0.5 rounded-md border border-indigo-200 hover:border-indigo-400 transition cursor-pointer">Edit</button>
                                <button
                                  onClick={() => handleDeleteReview(existingReview.id)}
                                  className="text-xs text-red-500 hover:bg-red-50 font-medium px-2 py-0.5 rounded-md border border-red-200 hover:border-red-400 transition cursor-pointer">Delete</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReviewModal({ orderId: order.id, productId: item.productId, productName: item.name })}
                                className="text-xs text-indigo-600 hover:bg-indigo-50 font-medium px-2 py-0.5 rounded-md border border-indigo-200 hover:border-indigo-400 transition cursor-pointer">
                                Review
                              </button>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-right flex flex-col gap-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.totalPrice)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-slate-100">
                    <span>Total paid</span>
                    <span>{formatPrice(order.finalPrice ?? order.totalPrice)}</span>
                  </div>
                </div>
                {canPay && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-700">Promo Code</label>
                      <input type="text" placeholder="Enter promo code"
                        value={couponCodes[order.id] || ""}
                        onChange={(e) => setCouponCodes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <button onClick={() => handlePayNow(order.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm transition">
                      Pay Now
                    </button>
                  </div>
                )}
                {["paid", "refunded", "refunding"].includes(order.paymentStatus) && (() => {
                  const report = reports.find((r) => r.orderId === order.id);
                  const statusColors = {
                    open: "bg-yellow-100 text-yellow-700",
                    in_progress: "bg-indigo-100 text-indigo-700",
                    resolved: "bg-green-100 text-green-700",
                    rejected: "bg-red-100 text-red-700",
                  };
                  return (
                    <>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleDownloadInvoice(order.id)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm transition">
                          Download Invoice
                        </button>
                        {!report && order.paymentStatus === "paid" && (
                          <button onClick={() => setReportModal(order.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm transition">
                            Report
                          </button>
                        )}
                      </div>
                      {report && (
                        <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium ${statusColors[report.status]}`}>
                          Report #{report.id} — {report.status.replace("_", " ")}
                        </div>
                      )}
                    </>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-bold mb-1 text-slate-800">{reviewModal.isEdit ? "Edit Review" : "Write Review"}: {reviewModal.productName}</h2>
            {!reviewModal.isEdit && <p className="text-sm text-slate-400 mb-4">Order #{reviewModal.orderId}</p>}
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)}
                      className={`text-2xl transition ${star <= reviewRating ? "text-yellow-400" : "text-slate-200 hover:text-yellow-300"}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience (optional)..." rows={3}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setReviewModal(null); setReviewRating(0); setReviewComment(""); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm transition">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-800">Report Order #{reportModal}</h2>
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Select reason</option>
                <option value="not_received">Item not received</option>
                <option value="wrong_item">Wrong item</option>
                <option value="damaged">Item damaged</option>
                <option value="other">Other</option>
              </select>
              <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe the issue..." rows={4}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setReportModal(null); setReportReason(""); setReportDescription(""); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
