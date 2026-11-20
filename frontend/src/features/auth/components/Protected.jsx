import { useAuth } from "../Hooks/useAuth"
import { Navigate, useLocation } from "react-router-dom"
import Loading from "../components/Loading/Loading.jsx"

const Protected = ({children}) => {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  if(!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
  
}

export default Protected