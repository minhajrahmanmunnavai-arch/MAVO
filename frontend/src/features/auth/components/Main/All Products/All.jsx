import FlashOfferings from "./Flash-Offerings"
import Cart from "../cart/Cart.jsx"
import { useWishlist } from "../../../Hooks/useWishlist.js";
import { useCart } from "../../../Hooks/useCart.js";
import { useProduct } from "../../../Hooks/useProduct.js";

const All = () => {

  const { products, loading, productsError, fetchProducts } = useProduct();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const toggleWishlist = async (product) => {
    const productId = String(product._id);
    try {
      if (wishlist.some((item) => String(item.id) === productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      console.error("Unable to update wishlist:", error);
    }
  };

  return (
    <section className="mt-25 px-37">
      <FlashOfferings />

      {productsError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center gap-3 text-sm text-red-600"
        >
          <span>{productsError}</span>
          <button
            type="button"
            className="rounded-md border border-red-600 px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={fetchProducts}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-label="Loading"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                />
                Loading...
              </span>
            ) : (
              "Try Again"
            )}
          </button>
        </div>
      )}

      <div className="flex gap-7 flex-2/4">

        {products.map((product) => (
          <Cart
            key={product._id}
            id={String(product._id)}
            mainImage={product.mainImage}
            price={product.price}
            discountPrice={product.discountPrice}
            discountPercentage={product.discountPercentage}
            shopName={product.shopName}
            productName={product.productName}
            title={product.title}
            ratingScore={product.ratingScore}
            unitsSold={product.unitsSold}
            brandName={product.brandName}
            category={product.category}
            description={product.description}
            stock={product.stock}
            wishlist={wishlist}
            onToggleWishlist={() => toggleWishlist(product)}
            onAddToCart={() => addToCart(product)}
          />
        ))}
      </div>


    </section>
  )
}


export default All