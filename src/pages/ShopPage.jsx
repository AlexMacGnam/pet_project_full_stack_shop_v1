import { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import SearchBar from "../components/SearchBar";
import { useProductFilter } from "../hooks/useProductFilter";
import { getProducts } from "../api/products";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  const { filtered, searchQuery, setSearchQuery, sortBy, setSortBy } =
    useProductFilter(products);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SearchBar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        sortBy={sortBy}
        onSort={setSortBy}
      />
      {error && <p className="text-center text-red-500 py-8">{error}</p>}
      <ProductList products={filtered} />
    </div>
  );
}
