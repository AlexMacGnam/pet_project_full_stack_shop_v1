import { formatPrice } from "../utils/format";

const STATUS_STYLES = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const REASON_LABELS = {
  not_received: "Not received",
  wrong_item: "Wrong item",
  damaged: "Item damaged",
  other: "Other",
};

export default function AdminReportsTab({ reports, onPatch, onRefund }) {
  if (reports.length === 0)
    return <p className="text-center text-slate-400 py-8">No reports yet</p>;

  return (
    <ul className="flex flex-col gap-4">
      {reports.map((report) => {
        const closed = report.status === "resolved" || report.status === "rejected";
        return (
          <li key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-slate-800">Report #{report.id}</p>
                <p className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[report.status]}`}>
                {report.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm text-slate-600 flex flex-col gap-1 mb-3">
              <p>👤 {report.userName} — {report.userEmail}</p>
              <p>🛒 Order #{report.orderId} · {formatPrice(report.orderTotal)}</p>
              <p>📌 {REASON_LABELS[report.reason] || report.reason}</p>
              {report.description && <p className="text-slate-500 italic">"{report.description}"</p>}
            </div>
            {!closed && (
              <div className="flex gap-2 mt-2">
                {report.status === "open" && (
                  <button onClick={() => onPatch(report.id, "in_progress")}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm transition cursor-pointer">
                    Start Review
                  </button>
                )}
                {report.status === "in_progress" && (
                  <button onClick={() => onRefund(report.id)}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm transition cursor-pointer">
                    Approve Refund
                  </button>
                )}
                <button onClick={() => onPatch(report.id, "rejected")}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm transition cursor-pointer">
                  Reject
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
