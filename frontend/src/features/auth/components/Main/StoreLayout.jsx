import { Outlet, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Navbar from "../Navbar/Navbar.jsx";

const StoreLayout = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
};

export default StoreLayout;
