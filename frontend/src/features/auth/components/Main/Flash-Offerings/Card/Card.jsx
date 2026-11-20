
import ProductCard from "./CardDesign";
import { useWishlist } from "../../../../Hooks/useWishlist.js";
import { useProduct } from "../../../../Hooks/useProduct.js";

const Card = () => {
  const { products } = useProduct();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const toggleWishlist = async (product) => {
    try {
      if (wishlist.some((item) => String(item.id) === String(product.id))) {
        await removeFromWishlist(product.id);
      } else {
        const fullProduct = products.find(
          (item) => String(item._id) === String(product.id)
        );
        if (fullProduct) await addToWishlist(fullProduct);
      }
    } catch (error) {
      console.error("Unable to update wishlist:", error);
    }
  };

  return (
    <div className="flex gap-7 justify-between">
      {products.map((elem) => (
        <ProductCard
          key={elem._id}
          id={elem._id}
          img={elem.mainImage}
          discount={elem.discountPrice}
          shopName={elem.shopName}
          itemName={elem.productName}
          productTitle={elem.title}
          reatingStar={elem.reatingStar}
          reating={elem.reating}
          price={elem.price}
          discoutnPrice={elem.discountPrice}
          wishlist={wishlist}
          onToggleWishlist={() => toggleWishlist({ id: elem._id })}
        />
      ))}
    </div>
  );
};

export default Card;
