import { createBrowserRouter } from "react-router-dom";
import  Home  from "./features/auth/pages/Home";
import  Login  from "./features/auth/pages/Login.jsx";
import  Register  from "./features/auth/pages/Register.jsx";
import  Cart  from "./features/auth/pages/Cart.jsx";
import ShoppingCartPage from "./features/auth/pages/ShoppingCartPage.jsx";
import MyOrdersPage from "./features/auth/pages/MyOrdersPage.jsx";
import OrderChatPage from "./features/auth/pages/OrderChatPage.jsx";
import Category from "./features/auth/pages/Category.jsx";
import Admin from "./features/auth/pages/Admin.jsx";
import PrivacyPolicy from "./features/auth/pages/PrivacyPolicy.jsx";
import TermsOfService from "./features/auth/pages/TermsOfService.jsx";
import ProductDetails from "./features/auth/pages/ProductDetails.jsx";
import ShopCatalogPage from "./features/auth/pages/ShopCatalogPage.jsx";
import ProductReviewPage from "./features/auth/pages/ProductReviewPage.jsx";
import AdminProtected from "./features/auth/components/adminProtected.jsx";
import Protected from "./features/auth/components/Protected.jsx";
import StoreLayout from "./features/auth/components/Main/StoreLayout.jsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <StoreLayout />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "category",
                element: <Category />
            },
            {
                path: "product/:id",
                element: <ProductDetails />
            },
            {
                path: "shop-catalog",
                element: <ShopCatalogPage />
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            {
                path: "privacy",
                element: <PrivacyPolicy />
            },
            {
                path: "terms",
                element: <TermsOfService />
            },
            {
                path: "cart",
                element: (
                    <Protected>
                        <ShoppingCartPage />
                    </Protected>
                )
            },
            {
                path: "my-orders",
                element: (
                    <Protected>
                        <MyOrdersPage />
                    </Protected>
                )
            },
            {
                path: "my-orders/:orderId/chat",
                element: (
                    <Protected>
                        <OrderChatPage />
                    </Protected>
                )
            },
            {
                path: "my-orders/:orderId/review/:productId",
                element: (
                    <Protected>
                        <ProductReviewPage />
                    </Protected>
                )
            },
            {
                path: "wishlist",
                element: (
                    <Protected>
                        <Cart />
                    </Protected>
                )
            }
        ]
    },
    {
        path: "/admin",
        element: (
            <AdminProtected>
                <Admin />
            </AdminProtected>
        )
    }
]);