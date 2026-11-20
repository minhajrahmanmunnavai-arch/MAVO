import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createCategory as createCategoryRequest,
  deleteCategoryById,
  getCategories,
} from '../../services/category.api.js';
import {
  getAdminNotifications,
  deleteAdminNotification as deleteAdminNotificationRequest,
  markAdminNotificationRead as markAdminNotificationReadRequest,
  markAllAdminNotificationsRead as markAllAdminNotificationsReadRequest,
} from '../../services/adminNotification.api.js';
import {
  getAdminOrders,
  updateAdminOrderStatus as updateAdminOrderStatusRequest,
} from '../../services/adminOrder.api.js';
import { getAllProducts } from '../../services/productupload.api.js';
import { getAdminCustomers } from '../../services/customer.api.js';
import { getAdminReviews } from '../../services/adminReview.api.js';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCoupons,
} from '../../services/adminCoupon.api.js';
import { getAdminConversations } from '../../services/chat.api.js';
import { subscribeToLiveUpdates } from '../../services/liveUpdates.api.js';
import { useAuth } from '../../Hooks/useAuth.js';

export const AdminContext = createContext(null);

export function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }

  return context;
}

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [selectedProductId, setSelectedProductId] = useState('PRD-101');
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-9842');
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-201');
  const [selectedSellerId, setSelectedSellerId] = useState('SEL-301');
  const [selectedReview, setSelectedReview] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [adminProfile] = useState({
    name: 'Minhaj Rahman',
    email: 'minhajrahmanmunnavai@gmail.com',
    phone: '+1 (555) 234-5678',
    role: 'Super Administrator',
    avatar: '/src/assets/images/avatar_admin_user_1790954996172.jpg',
    joinedDate: 'January 2025',
    lastLogin: 'Just now (104.28.192.1)',
  });

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [chatConversationCount, setChatConversationCount] = useState(0);
  const chatConversationCountRequestId = useRef(0);
  const [reviewCount, setReviewCount] = useState(0);
  const reviewCountRequestId = useRef(0);

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponsError, setCouponsError] = useState('');

  const [sellers, setSellers] = useState([
    {
      id: 'SEL-301',
      businessName: 'Nordic Gear Studio',
      ownerName: 'Lukas Lindqvist',
      status: 'Under Review',
      productsCount: 14,
      totalSales: 4890,
    },
    {
      id: 'SEL-302',
      businessName: 'Veloce Audio Labs',
      ownerName: 'Marco Rossi',
      status: 'Approved',
      productsCount: 9,
      totalSales: 2540,
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-1',
      title: 'New Order Received',
      message: 'Elena Rostova placed order #ORD-9842 for ৳249.00',
      type: 'order',
      timestamp: '5m ago',
      read: false,
      route: 'order-details',
      param: 'ORD-9842',
    },
    {
      id: 'NOTIF-2',
      title: 'Seller Application Submitted',
      message: 'Nordic Gear Studio submitted documents for partner verification.',
      type: 'seller',
      timestamp: '22m ago',
      read: false,
      route: 'seller-details',
      param: 'SEL-301',
    },
  ]);
  const deletedNotificationIds = useRef(new Set());

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    let active = true;
    const loadNotifications = async () => {
      try {
        const serverNotifications = await getAdminNotifications();
        if (active) {
          const visibleServerNotifications = serverNotifications.filter(
            (notification) => !deletedNotificationIds.current.has(notification.id)
          );
          setNotifications((currentNotifications) => {
            const localNotifications = currentNotifications.filter(
              (notification) => !/^[a-f\d]{24}$/i.test(notification.id)
            );
            return [...visibleServerNotifications, ...localNotifications];
          });
        }
      } catch (error) {
        if (active) {
          console.error('Unable to refresh admin notifications:', error);
        }
      }
    };

    loadNotifications();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'order:changed' || update.type === 'notifications:changed') {
        loadNotifications();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setCoupons([]);
      setCouponsLoading(false);
      setCouponsError('');
      return undefined;
    }

    let active = true;
    const loadCoupons = async () => {
      try {
        const loadedCoupons = await getAdminCoupons();
        if (active) {
          setCoupons(loadedCoupons);
          setCouponsError('');
        }
      } catch (error) {
        if (active) {
          setCouponsError(
            error.response?.data?.message || error.message || 'Unable to load coupons.'
          );
        }
      } finally {
        if (active) setCouponsLoading(false);
      }
    };

    setCouponsLoading(true);
    loadCoupons();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'coupons:changed') loadCoupons();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    const loadChatConversationCount = async () => {
      const requestId = ++chatConversationCountRequestId.current;
      try {
        const conversations = await getAdminConversations();
        if (chatConversationCountRequestId.current === requestId) {
          setChatConversationCount(conversations.length);
        }
      } catch (error) {
        if (chatConversationCountRequestId.current === requestId) {
          console.error('Unable to refresh admin chat conversation count:', error);
        }
      }
    };

    loadChatConversationCount();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'chat:changed') loadChatConversationCount();
    });

    return () => {
      chatConversationCountRequestId.current += 1;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    const loadReviewCount = async () => {
      const requestId = ++reviewCountRequestId.current;
      try {
        const reviews = await getAdminReviews();
        if (reviewCountRequestId.current === requestId) {
          setReviewCount(reviews.length);
        }
      } catch (error) {
        if (reviewCountRequestId.current === requestId) {
          console.error('Unable to refresh admin review count:', error);
        }
      }
    };

    loadReviewCount();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'reviews:changed') loadReviewCount();
    });

    return () => {
      reviewCountRequestId.current += 1;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    let active = true;

    const loadOrders = async () => {
      try {
        const loadedOrders = await getAdminOrders();
        if (active) {
          setOrders(loadedOrders);
          setOrdersError('');
        }
      } catch (error) {
        if (active) {
          setOrdersError(
            error.response?.data?.message || error.message || 'Unable to load orders.'
          );
        }
      } finally {
        if (active) setOrdersLoading(false);
      }
    };

    loadOrders();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'order:changed') loadOrders();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    let active = true;
    const loadProducts = async () => {
      try {
        const loadedProducts = await getAllProducts();
        if (active) {
          setProducts(loadedProducts.map((item) => {
            const stock = Number(item.stock) || 0;
            const lowStockThreshold = Number(item.lowStock) || 0;
            return {
              id: String(item._id),
              name: item.title || item.productName || '',
              sku: item.sku || '',
              brand: item.brandName || '',
              category: item.category || '',
              subcategory: item.section || '',
              price: Number(item.price) || 0,
              salePrice: Number(item.discountPrice) || 0,
              stock,
              lowStockThreshold,
              status: stock === 0
                ? 'Out of Stock'
                : stock <= lowStockThreshold
                  ? 'Low Stock'
                  : 'Active',
              image: item.mainImage || '',
              rating: Number(item.rating) || 0,
              reviewsCount: Number(item.reviewsCount) || 0,
              salesCount: Number(item.salesCount) || 0,
              createdAt: item.createdAt || '',
              specifications: Array.isArray(item.specifications) ? item.specifications : [],
            };
          }));
        }
      } catch (error) {
        if (active) console.error('Unable to refresh admin products:', error);
      }
    };

    loadProducts();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'products:changed') loadProducts();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    let active = true;
    const loadCustomers = async () => {
      try {
        const loadedCustomers = await getAdminCustomers();
        if (active) setCustomers(loadedCustomers);
      } catch (error) {
        if (active) console.error('Unable to refresh admin customers:', error);
      } finally {
        if (active) setCustomersLoading(false);
      }
    };

    loadCustomers();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'customers:changed' || update.type === 'order:changed') {
        loadCustomers();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  const addToast = ({ title, message, type = 'info', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;

    let active = true;

    const loadCategories = async () => {
      try {
        const loadedCategories = await getCategories();
        if (active) {
          setCategories(loadedCategories);
          setCategoriesError('');
        }
      } catch (error) {
        if (active) {
          setCategoriesError(
            error.response?.data?.message || error.message || 'Unable to load categories.'
          );
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    };

    loadCategories();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === 'categories:changed') loadCategories();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const navigateTo = (route, params = {}) => {
    if (params.productId) setSelectedProductId(params.productId);
    if (params.orderId) setSelectedOrderId(params.orderId);
    if (params.customerId) setSelectedCustomerId(params.customerId);
    if (params.sellerId) setSelectedSellerId(params.sellerId);
    if (params.review) setSelectedReview(params.review);

    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addProduct = (productData) => {
    const id = `PRD-${Date.now().toString().slice(-3)}`;
    const newProduct = {
      id,
      ...productData,
      rating: 5.0,
      reviewsCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => [newProduct, ...prev]);
    addToast({
      title: 'Product Published',
      message: `"${newProduct.name}" added to catalog.`,
      type: 'success',
    });
    navigateTo('products');
  };

  const addCategory = async (categoryData) => {
    const newCategory = await createCategoryRequest(categoryData);
    setCategories((currentCategories) => [newCategory, ...currentCategories]);
    setCategoriesError('');
    setCategoriesLoading(false);
    addToast({
      title: 'Category Created',
      message: `"${newCategory.name}" added to categories.`,
      type: 'success',
    });

    return newCategory;
  };

  const addCoupon = async (couponData) => {
    const coupon = await createAdminCoupon(couponData);
    setCoupons((currentCoupons) => [coupon, ...currentCoupons]);
    setCouponsError('');
    addToast({
      title: 'Coupon Created',
      message: `Coupon ${coupon.code} is ready to use.`,
      type: 'success',
    });
    return coupon;
  };

  const deleteCoupon = async (couponId) => {
    await deleteAdminCoupon(couponId);
    setCoupons((currentCoupons) =>
      currentCoupons.filter((coupon) => coupon.id !== couponId)
    );
    addToast({
      title: 'Coupon Deleted',
      message: 'The coupon has been removed.',
      type: 'success',
    });
  };

  const deleteCategory = async (categoryId) => {
    await deleteCategoryById(categoryId);
    setCategories((currentCategories) =>
      currentCategories.filter((categoryItem) => categoryItem.id !== categoryId)
    );
    addToast({
      title: 'Category Deleted',
      message: 'Category removed from the catalog.',
      type: 'success',
    });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updatedOrder = await updateAdminOrderStatusRequest(orderId, newStatus);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      addToast({
        title: 'Order Status Updated',
        message: `Order #${orderId} marked as ${updatedOrder.orderStatus}.`,
        type: 'success',
      });
      return true;
    } catch (error) {
      addToast({
        title: 'Order Status Update Failed',
        message: error.response?.data?.message || error.message || 'Unable to update order status.',
        type: 'error',
      });
      return false;
    }
  };

  const updateStock = (productId, newStock) => {
    setProducts((prev) =>
      prev.map((productItem) => {
        if (productItem.id !== productId) return productItem;

        const stockNum = Math.max(0, Number.parseInt(newStock, 10) || 0);
        const status = stockNum === 0 ? 'Out of Stock' : stockNum <= productItem.lowStockThreshold ? 'Low Stock' : 'Active';

        return { ...productItem, stock: stockNum, status };
      })
    );

    addToast({
      title: 'Stock Adjusted',
      message: 'Inventory levels synchronized.',
      type: 'info',
    });
  };

  const markNotificationAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    if (/^[a-f\d]{24}$/i.test(id)) {
      try {
        await markAdminNotificationReadRequest(id);
      } catch (error) {
        console.error('Unable to mark notification as read:', error);
        addToast({
          title: 'Notification Update Failed',
          message: error.response?.data?.message || error.message || 'Unable to update notification.',
          type: 'error',
        });
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    if (user?.role === 'admin') {
      try {
        await markAllAdminNotificationsReadRequest();
      } catch (error) {
        console.error('Unable to mark all notifications as read:', error);
        addToast({
          title: 'Notification Update Failed',
          message: error.response?.data?.message || error.message || 'Unable to update notifications.',
          type: 'error',
        });
      }
    }
    addToast({
      title: 'Notifications Cleared',
      message: 'All alerts marked as read.',
      type: 'info',
    });
  };

  const deleteNotification = async (id) => {
    const isPersistedNotification = /^[a-f\d]{24}$/i.test(id);

    try {
      if (isPersistedNotification) {
        await deleteAdminNotificationRequest(id);
      }

      deletedNotificationIds.current.add(id);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== id)
      );
      return true;
    } catch (error) {
      console.error('Unable to delete notification:', error);
      addToast({
        title: 'Notification Delete Failed',
        message: error.response?.data?.message || error.message || 'Unable to delete notification.',
        type: 'error',
      });
      return false;
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <AdminContext.Provider
      value={{
        currentRoute,
        selectedProductId,
        selectedOrderId,
        selectedCustomerId,
        selectedSellerId,
        selectedReview,
        isSidebarCollapsed,
        isMobileSidebarOpen,
        isSearchModalOpen,
        isAuthenticated,
        product,
        setProduct,
        loading,
        setLoading,
        toasts,
        adminProfile,
        products,
        categories,
        categoriesLoading,
        categoriesError,
        orders,
        ordersLoading,
        ordersError,
        chatConversationCount,
        reviewCount,
        customers,
        customersLoading,
        coupons,
        couponsLoading,
        couponsError,
        sellers,
        notifications,
        unreadCount,
        setCurrentRoute,
        setSelectedProductId,
        setSelectedOrderId,
        setSelectedCustomerId,
        setSelectedSellerId,
        setSelectedReview,
        setIsSidebarCollapsed,
        setIsMobileSidebarOpen,
        setIsSearchModalOpen,
        setIsAuthenticated,
        toggleSidebar,
        navigateTo,
        addToast,
        removeToast,
        addProduct,
        addCategory,
        deleteCategory,
        updateOrderStatus,
        updateStock,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        setCategories,
        setProducts,
        setOrders,
        setCustomers,
        addCoupon,
        deleteCoupon,
        setCoupons,
        setSellers,
        setNotifications,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
