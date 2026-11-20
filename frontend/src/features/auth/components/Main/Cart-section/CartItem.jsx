
import { ArrowRight, Heart, ShoppingCart } from "lucide-react";

const CartItem = ({
    id,
    img,
    shopName,
    productTitle,
    price,
    onRemove,
    onMoveToBag,
}) => {
    const handleFavorite = async () => {
        if (onRemove) {
            await onRemove(id);
        }
    };

    return (
        <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                <img
                    src={img}
                    alt={productTitle}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <button
                    type="button"
                    onClick={handleFavorite}
                    aria-label={`Remove ${productTitle} from wishlist`}
                    title="Remove from wishlist"
                    className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/95 text-rose-600 shadow-md transition hover:scale-105 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 max-[421px]:right-2 max-[421px]:top-2 max-[421px]:h-9 max-[421px]:w-9"
                >
                    <Heart size={19} className="fill-current" />
                </button>
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-600 shadow-sm backdrop-blur max-[421px]:bottom-2 max-[421px]:left-2 max-[421px]:px-2 max-[421px]:text-[0.625rem]">
                    Saved for later
                </span>
            </div>

            <div className="flex flex-1 flex-col p-5 max-[421px]:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 max-[421px]:text-[0.625rem]">
                    {shopName || "MAVO collection"}
                </p>

                <h3 className="mt-2 line-clamp-2 min-h-12 break-words text-base font-semibold leading-6 text-stone-900 max-[421px]:min-h-10 max-[421px]:text-[0.9375rem] max-[421px]:leading-5">
                    {productTitle}
                </h3>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-4">
                    <span className="text-xs text-stone-500 max-[421px]:text-[0.6875rem]">Price</span>
                    <p className="text-lg font-semibold text-stone-900 max-[421px]:text-sm">
                        ৳{Number(price).toFixed(2)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        onMoveToBag?.({ id, img, shopName, productTitle, price })
                    }
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 max-[421px]:mt-3 max-[421px]:gap-1 max-[421px]:px-2 max-[421px]:py-2 max-[421px]:text-[0.6875rem]"
                >
                    <ShoppingCart size={16} className="max-[421px]:h-3.5 max-[421px]:w-3.5" />
                    Add to Cart
                    <ArrowRight size={15} className="ml-auto transition group-hover:translate-x-0.5 max-[421px]:hidden" />
                </button>
            </div>
        </article>
    );
};

export default CartItem;
