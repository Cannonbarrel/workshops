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
