import { useState, useMemo } from "react";

/**
 * Filters and sorts a product list based on search query and sort option.
 * Returns filtered products and controls for search and sort.
 */
export function useProductFilter(products) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchQuery, sortBy]);

  return { filtered, searchQuery, setSearchQuery, sortBy, setSortBy };
}
