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
