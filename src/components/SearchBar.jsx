export default function SearchBar({ searchQuery, onSearch, sortBy, onSort }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
      />
      <select
        value={sortBy}
        onChange={(e) => onSort(e.target.value)}
        className="bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
      >
        <option value="default">Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A to Z</option>
      </select>
    </div>
  );
}
