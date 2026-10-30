import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtpForgot } from "../api/auth";
import toast from "react-hot-toast";

export default function VerifyOtpForgotPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyOtpForgot({ email, otp });
      navigate("/change-password", { state: { resetToken: data.resetToken } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Verify OTP</h1>
        <p className="text-slate-500 text-sm mb-6">
          Enter the OTP code sent to{" "}
          <span className="font-medium text-slate-700">{email}</span>
        </p>
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
