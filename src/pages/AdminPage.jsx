import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getReports, patchReport, refundReport } from "../api/reports";
import { getUsers } from "../api/users";
import { getCoupons } from "../api/coupons";
import { useAuth } from "../context/AuthContext";
import AdminReportsTab from "../components/AdminReportsTab";
import AdminUsersTab from "../components/AdminUsersTab";
import AdminCouponsTab from "../components/AdminCouponsTab";
import toast from "react-hot-toast";

const TABS = ["Reports", "Users", "Coupons"];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Reports");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    Promise.all([
      getReports().catch(() => []),
      getUsers().catch(() => []),
      getCoupons().catch(() => []),
    ]).then(([r, u, c]) => {
      setReports(r);
      setUsers(u);
      setCoupons(c);
    }).finally(() => setLoading(false));
  }, [user]);

  async function handlePatch(id, status) {
    try {
      const updated = await patchReport(id, status);
      setReports((prev) => prev.map((r) => r.id === updated.id ? { ...r, status: updated.status } : r));
      toast.success(`Status updated to ${status.replace("_", " ")}`);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  }

  async function handleRefund(id) {
    try {
      await refundReport(id);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r));
      toast.success("Refund issued successfully");
    } catch (err) {
      toast.error(err.message || "Failed to issue refund");
    }
  }

  if (loading) return <p className="text-center py-8 text-slate-400">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Admin Panel</h1>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Reports" && <AdminReportsTab reports={reports} onPatch={handlePatch} onRefund={handleRefund} />}
      {activeTab === "Users" && <AdminUsersTab users={users} />}
      {activeTab === "Coupons" && <AdminCouponsTab coupons={coupons} setCoupons={setCoupons} />}
    </div>
  );
}
