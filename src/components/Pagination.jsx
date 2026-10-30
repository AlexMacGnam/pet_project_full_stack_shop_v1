export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange((p) => p - 1)}
        disabled={page === 1}
        className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg border transition ${
            p === page
              ? "bg-blue-600 text-white border-blue-600"
              : "hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange((p) => p + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition"
      >
        →
      </button>
    </div>
  );
}
