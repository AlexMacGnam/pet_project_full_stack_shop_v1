import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function VerifyOtpPage() {
  const { login } = useAuth();
  const { switchToUser } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp({ email, otp });
      login(data.user, data.accessToken, data.refreshToken);
      switchToUser(data.user.id);
      toast.success("Account verified!");
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Verify Account</h1>
        <p className="text-slate-500 text-sm mb-6">
          Enter the OTP code sent to{" "}
          <span className="font-medium text-slate-700">{email}</span>
        </p>
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP code"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center text-xl tracking-widest text-slate-800" />
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg transition">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
