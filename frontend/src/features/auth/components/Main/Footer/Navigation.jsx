import { Link } from "react-router-dom"

const Navigation = () => {
    return (
        <div>
            <h1 className="text-[18px] mb-5">Navigation</h1>
            <nav className="flex flex-col text-gray-400 gap-2.5 hover:text-gray-400">
                <Link className="hover:text-gray-200" to=''>All Products</Link>
                <Link className="hover:text-gray-200" to=''>Colletions</Link>
                <Link className="hover:text-gray-200" to=''>Search Catalog</Link>
                <Link className="hover:text-gray-200" to=''>Become a Seller</Link>
            </nav>
        </div>
    )
}

export default Navigation