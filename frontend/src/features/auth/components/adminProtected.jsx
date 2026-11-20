import { useAuth } from "../Hooks/useAuth"
import { Navigate } from "react-router-dom"
import Loading from "../components/Loading/Loading.jsx"

const AdminProtected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return <Loading />
    }

    if (!user || user.role !== "admin") {
        return <Navigate to="/login" replace />
    }

    return children
}

export default AdminProtected