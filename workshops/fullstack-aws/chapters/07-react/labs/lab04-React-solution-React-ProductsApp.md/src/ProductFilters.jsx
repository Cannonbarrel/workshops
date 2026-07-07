function ProductFilters({
  searchText,
  onSearchTextChange,
  category,
  onCategoryChange,
  showInStockOnly,
  onShowInStockOnlyChange,
  categories,
}) {
  return (
    <div className="product-filters">
      <label>
        Search:
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="Search products"
        />
      </label>

      <label>
        Category:
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={showInStockOnly}
          onChange={(e) => onShowInStockOnlyChange(e.target.checked)}
        />
        Show in-stock only
      </label>
    </div>
  );
}

export default ProductFilters;
