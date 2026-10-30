import { useState } from "react";
import { createCoupon, updateCoupon, deleteCoupon } from "../api/coupons";
import { formatPrice } from "../utils/format";
import toast from "react-hot-toast";

const EMPTY_FORM = { code: "", discountType: "percent", discountValue: "" };

export default function AdminCouponsTab({ coupons, setCoupons }) {
  const [couponForm, setCouponForm] = useState(EMPTY_FORM);
  const [editingCode, setEditingCode] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...couponForm, discountValue: Number(couponForm.discountValue) };
    try {
      if (editingCode) {
        const updated = await updateCoupon(editingCode, { discountType: payload.discountType, discountValue: payload.discountValue });
        setCoupons((prev) => prev.map((c) => c.code === editingCode ? updated : c));
        toast.success("Coupon updated");
      } else {
        const created = await createCoupon(payload);
        setCoupons((prev) => [...prev, created]);
        toast.success("Coupon created");
      }
      setCouponForm(EMPTY_FORM);
      setEditingCode(null);
    } catch (err) {
      toast.error(err.message || "Failed to save coupon");
    }
  }

  async function handleDelete(code) {
    try {
      await deleteCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete coupon");
    }
  }

  function startEdit(coupon) {
    setEditingCode(coupon.code);
    setCouponForm({ code: coupon.code, discountType: coupon.discountType, discountValue: String(coupon.discountValue) });
  }

  function cancelEdit() {
    setEditingCode(null);
    setCouponForm(EMPTY_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
        <h2 className="font-bold text-slate-800">{editingCode ? `Edit: ${editingCode}` : "New Coupon"}</h2>
        <input
          type="text"
          placeholder="Code (e.g. SALE10)"
          value={couponForm.code}
          onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          disabled={!!editingCode}
          required
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <select
          value={couponForm.discountType}
          onChange={(e) => setCouponForm((p) => ({ ...p, discountType: e.target.value }))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed amount (VND)</option>
        </select>
        <input
          type="number"
          placeholder={couponForm.discountType === "percent" ? "Value (1–100)" : "Value in VND"}
          value={couponForm.discountValue}
          onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))}
          min={1}
          max={couponForm.discountType === "percent" ? 100 : undefined}
          required
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex gap-2">
          {editingCode && (
            <button type="button" onClick={cancelEdit}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm transition cursor-pointer">
              Cancel
            </button>
          )}
          <button type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm transition cursor-pointer">
            {editingCode ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </form>

      {coupons.length === 0 ? (
        <p className="text-center text-slate-400 py-4">No coupons yet</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {coupons.map((c) => (
            <li key={c.code} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{c.code}</p>
                <p className="text-xs text-slate-400">
                  {c.discountType === "percent" ? `${c.discountValue}% off` : `${formatPrice(c.discountValue)} off`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(c)}
                  className="text-xs text-indigo-600 hover:bg-indigo-50 font-medium px-3 py-1.5 rounded-md border border-indigo-200 hover:border-indigo-400 transition cursor-pointer">
                  Edit
                </button>
                <button onClick={() => handleDelete(c.code)}
                  className="text-xs text-red-500 hover:bg-red-50 font-medium px-3 py-1.5 rounded-md border border-red-200 hover:border-red-400 transition cursor-pointer">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
