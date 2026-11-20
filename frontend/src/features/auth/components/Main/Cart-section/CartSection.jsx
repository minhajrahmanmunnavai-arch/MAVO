import { Heart, Sparkles } from "lucide-react";

const CartSection = ({ count = 0 }) => {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-8 shadow-sm sm:px-9 sm:py-10">
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-rose-100/60 blur-2xl"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
            <Sparkles size={14} />
            Your collection
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Your wishlist
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
            Keep the pieces you love close by, and move them to your bag whenever you&apos;re ready.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Heart size={19} className="fill-current" />
          </span>
          <span>
            <span className="block text-xl font-semibold leading-5 text-stone-900">{count}</span>
            <span className="mt-1 block text-xs text-stone-500">
              {count === 1 ? "saved item" : "saved items"}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default CartSection;