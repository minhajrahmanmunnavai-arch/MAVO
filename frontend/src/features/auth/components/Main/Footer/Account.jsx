import { Link } from "react-router-dom"

const Account = () => {
    return (
        <div>
            <h1 className="text-[18px] mb-5">Account</h1>
            <nav className="flex flex-col text-gray-400 gap-2.5 ">
                <Link className="hover:text-gray-200" to=''>Sign In</Link>
                <Link className="hover:text-gray-200" to=''>Create Account</Link>
                <Link className="hover:text-gray-200" to=''>Password Reset</Link>
                <Link className="hover:text-gray-200" to=''>Seller Onboarding</Link>
            </nav>
        </div>
    )
}

export default Account