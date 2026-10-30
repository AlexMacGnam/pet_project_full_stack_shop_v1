import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgot } from "../api/auth";
import toast from "react-hot-toast";

export default function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgot({ email });
      navigate("/verify-otp-forgot", { state: { email } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Forgot Password</h1>
        <p className="text-slate-500 text-sm mb-6">
          Enter your email and we'll send you an OTP to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400" />
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg transition">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
