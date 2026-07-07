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
