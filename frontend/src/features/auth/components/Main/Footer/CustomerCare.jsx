import { Link } from "react-router-dom"

const CustomerCare = () => {
    return (
        <div>
            <h1 className="text-[18px] mb-5">Customer Care</h1>
            <nav className="flex flex-col text-gray-400 gap-2.5 ">
                <Link className="hover:text-gray-200" to=''>
                    Track Order
                </Link>
                <Link className="hover:text-gray-200" to=''>
                    Shopping Bag
                </Link>
                <Link className="hover:text-gray-200" to=''>
                    Saved Items
                </Link>
                <Link className="hover:text-gray-200" to=''>
                    Account Profile
                </Link>
            </nav>
        </div>
    )
}

export default CustomerCare