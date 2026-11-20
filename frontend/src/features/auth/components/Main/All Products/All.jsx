import FlashOfferings from "./Flash-Offerings"
import Cart from "../cart/Cart.jsx"
import { useWishlist } from "../../../Hooks/useWishlist.js";
import { useCart } from "../../../Hooks/useCart.js";
import { useProduct } from "../../../Hooks/useProduct.js";

const All = () => {

  const { products } = useProduct();
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