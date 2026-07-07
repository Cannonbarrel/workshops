# React Frontend Practice Lab 04

In this lab, students build a small product search and filter frontend using React. The goal is to practice working with arrays, derived state, controlled inputs, component composition, and conditional rendering.

## Student Goal

Build a product catalog interface where users can:
- view a list of product items,
- search products by name,
- filter products by category,
- toggle between showing all products or only in-stock products.

The app should manage filter state in React, render a filtered list dynamically, and keep UI logic separate from presentation.

## Plan / Steps / Hints

1. Start from a React app scaffold and create the main `ProductCatalog` component.
   - Hint: You can use Vite or CRA and add the component in `src/ProductCatalog.jsx`.

2. Define a static product list inside `ProductCatalog` or load it from a simple constant.
   - Hint: Each product should include `id`, `name`, `category`, `price`, and `inStock`.

3. Add state for search text, selected category, and the in-stock checkbox.
   - Hint: Use `useState` for each filter value.

4. Create the search controls as controlled inputs.
   - Hint: Use an input for text search, a `select` for category, and a checkbox for stock filter.

5. Derive visible products by applying all filters to the product list.
   - Hint: Use `Array.prototype.filter()` with `includes()` for search matching.

6. Render the filtered products using a dedicated `ProductCard` or `ProductList` component.
   - Hint: Use `key={product.id}` and show price and stock status.

7. Display a message when no products match the selected filters.
   - Hint: Use conditional rendering to show an empty state notice.

8. Keep the filter panel and product list separate for cleaner code.
   - Hint: Create `ProductFilters` and `ProductList` components.

9. Add a summary showing how many products match the filters.
   - Hint: Use the length of the filtered array.

10. Optionally add a small style block for layout and readability.
   - Hint: Make the product cards simple and easy to scan.

## Step-by-step Solution

### 1) `src/App.jsx`

```jsx
import ProductCatalog from './ProductCatalog';

function App() {
  return (
    <div className="app-shell">
      <h1>Product Search Catalog</h1>
      <ProductCatalog />
    </div>
  );
}

export default App;
```

### 2) `src/ProductCatalog.jsx`

```jsx
import { useState } from 'react';
import ProductFilters from './ProductFilters';
import ProductList from './ProductList';

const PRODUCTS = [
  { id: 1, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, inStock: true },
  { id: 2, name: 'Bluetooth Keyboard', category: 'Accessories', price: 49.99, inStock: false },
  { id: 3, name: 'Laptop Stand', category: 'Accessories', price: 19.99, inStock: true },
  { id: 4, name: 'Noise-Cancelling Headphones', category: 'Audio', price: 89.99, inStock: true },
  { id: 5, name: 'Portable Speaker', category: 'Audio', price: 59.99, inStock: false },
  { id: 6, name: '4K Monitor', category: 'Displays', price: 299.99, inStock: true },
];

const CATEGORIES = ['All', 'Accessories', 'Audio', 'Displays'];

function ProductCatalog() {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('All');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = category === 'All' || product.category === category;
    const matchesStock = !showInStockOnly || product.inStock;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <section className="product-catalog">
      <ProductFilters
        searchText={searchText}
        onSearchTextChange={setSearchText}
        category={category}
        onCategoryChange={setCategory}
        showInStockOnly={showInStockOnly}
        onShowInStockOnlyChange={setShowInStockOnly}
        categories={CATEGORIES}
      />

      <div className="product-summary">
        <p>{filteredProducts.length} products found</p>
      </div>

      <ProductList products={filteredProducts} />
    </section>
  );
}

export default ProductCatalog;
```

### 3) `src/ProductFilters.jsx`

```jsx
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
```

### 4) `src/ProductList.jsx`

```jsx
import ProductCard from './ProductCard';

function ProductList({ products }) {
  if (products.length === 0) {
    return <p>No products match your filters.</p>;
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;
```

### 5) `src/ProductCard.jsx`

```jsx
function ProductCard({ product }) {
  return (
    <article className={`product-card ${product.inStock ? '' : 'out-of-stock'}`}>
      <h3>{product.name}</h3>
      <p>Category: {product.category}</p>
      <p>Price: ${product.price.toFixed(2)}</p>
      <p>{product.inStock ? 'In stock' : 'Out of stock'}</p>
    </article>
  );
}

export default ProductCard;
```

### 6) Optional CSS

Add the following to `src/index.css` or `src/App.css`:

```css
.product-filters {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.product-filters label {
  display: flex;
  flex-direction: column;
}

.product-list {
  display: grid;
  gap: 1rem;
}

.product-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 6px;
}

.product-card.out-of-stock {
  opacity: 0.7;
}
```

## Notes

- This lab reinforces controlled inputs, derived filtering logic, and component props.
- Students can extend it by adding sorting, product images, or a category count summary.
- Encourage keeping filter state in the parent and passing values down through props.
