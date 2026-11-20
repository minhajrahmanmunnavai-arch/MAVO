import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { AdminProvider } from "./features/auth/components/contex/AdminContext.jsx";
import { ProductProvider } from "./features/auth/components/contex/ProductContext.jsx";
import { WishlistProvider } from "./features/auth/components/contex/WishlistContext.jsx";
import { CartProvider } from "./features/auth/components/contex/CartContext.jsx";

const App = () => {
    return (
        <AuthProvider>
            <AdminProvider>
                <ProductProvider>
                    <WishlistProvider>
                        <CartProvider>
                            <RouterProvider router={router} />
                        </CartProvider>
                    </WishlistProvider>
                </ProductProvider>
            </AdminProvider>
        </AuthProvider>
    );
};

export default App;