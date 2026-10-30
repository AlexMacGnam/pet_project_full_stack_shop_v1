import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../api/auth";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { switchToUser } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutApi();
    switchToUser(null);
    logout();
    toast.success("Logged out");
    navigate("/");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {user.name[0].toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-slate-800">{user.name}</h1>
          <p className="text-slate-500 text-sm">{user.email}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate("/orders")}
            className="w-full border border-slate-200 hover:bg-slate-50 py-2 rounded-lg transition text-slate-700">
            My Orders
          </button>
          <button onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
