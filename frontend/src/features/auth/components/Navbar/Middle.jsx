import { Link } from "react-router-dom"

const Middle = ({ className = "", mobile = false, onNavigate }) => {
    return (
        <nav
            aria-label="Main navigation"
            className={`${mobile
                ? "flex flex-col gap-1 font-medium text-stone-700"
                : "flex flex-row items-center justify-between gap-5 whitespace-nowrap font-medium text-gray-600 xl:gap-7"
            } ${className}`}
        >
            <Link onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 hover:bg-stone-50" : "transition-colors hover:text-black"} to='/'>Home</Link>
            <Link onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 hover:bg-stone-50" : "transition-colors hover:text-black"} to='/shop-catalog'>Shop Catalog</Link>
            <Link onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 hover:bg-stone-50" : "transition-colors hover:text-black"} to='/my-orders'>My Orders</Link>
        </nav>
    )
}


export default Middle 