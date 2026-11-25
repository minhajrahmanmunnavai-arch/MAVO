const crypto = require("node:crypto");
const orderModel = require("../models/order.model");
const orderIdempotencyModel = require("../models/orderIdempotency.model");
const productUploadModel = require("../models/productUpload.model");
const adminNotificationModel = require("../models/adminNotification.model");
const emailUtils = require("../utils/sendEmail");
const mongoose = require("mongoose");
const { publishUpdate } = require("../utils/liveUpdates");
const customerNotificationService = require("../utils/customerNotificationService");

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function getOrderRequestFingerprint({ products, totalAmount, address, paymentMethod }) {
    const normalizedProducts = products
        .map((item) => ({
            product: String(item.product?._id || item.product),
            quantity: Number(item.quantity),
            price: Number(item.price),
        }))
        .sort((left, right) =>
            left.product.localeCompare(right.product) ||
            left.quantity - right.quantity ||
            left.price - right.price
        );
    const normalizedAddress = {};
    for (const field of [
        "fullName",
        "email",
        "phoneNumber",
        "region",
        "address",
        "street",
        "city",
        "state",
    ]) {
        normalizedAddress[field] = String(address[field] || "").trim();
    }

    return crypto
        .createHash("sha256")
        .update(JSON.stringify({
            products: normalizedProducts,
            totalAmount: Number(totalAmount),
            address: normalizedAddress,
            paymentMethod,
        }))
        .digest("hex");
}

function getOrderStockRequirements(products) {
    if (!Array.isArray(products) || products.length === 0) {
        const error = new Error("At least one product is required.");
        error.statusCode = 400;
        throw error;
    }

    const requirements = new Map();
    for (const item of products) {
        const productId = item?.product?._id || item?.product;
        if (
            !mongoose.isValidObjectId(productId) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        ) {
            const error = new Error("Each order item must have a valid product and positive integer quantity.");
            error.statusCode = 400;
            throw error;
        }

        const id = String(productId);
        requirements.set(id, (requirements.get(id) || 0) + item.quantity);
    }

    return requirements;
}

async function restoreOrderStock(reservedStock) {
    for (const [productId, quantity] of reservedStock) {
        const result = await productUploadModel.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
        );
        if (result.matchedCount === 0) {
            throw new Error(`Unable to restore stock for product ${productId}.`);
        }
    }
}

async function reserveOrderStock(requirements) {
    const reservedStock = [];

    try {
        for (const [productId, quantity] of requirements) {
            const product = await productUploadModel.findOneAndUpdate(
                { _id: productId, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { new: true }
            );
            if (!product) {
                const error = new Error(
                    `Product ${productId} is unavailable or has insufficient stock.`
                );
                error.statusCode = 400;
                throw error;
            }
            reservedStock.push([productId, quantity]);
        }
    } catch (error) {
        try {
            await restoreOrderStock(reservedStock);
        } catch (restoreError) {
            console.error("Restore Order Stock Error:", restoreError);
            throw new Error("Unable to restore inventory after the order failed.");
        }
        throw error;
    }

    return reservedStock;
}


/**
 * @name createOrder
 * @description Create a new order
 * @access private (User only)
 */
async function createOrder(req, res) {
    let idempotencyRecord;
    let orderSaved = false;
    let savedOrder;

    try {
        const {
            products,
            totalAmount,
            address,
            paymentMethod = "cash_on_delivery",
        } = req.body;

        if (!products || products.length === 0 || !totalAmount || !address) {
            return res.status(400).json({
                message: "Invalid order data. Please provide total amount, and address."
            });
        }

        if (typeof address !== "object" || Array.isArray(address)) {
            return res.status(400).json({
                message: "Please provide complete shipping details."
            });
        }

        const hasCustomerDetails = [
            address.fullName,
            address.email,
            address.phoneNumber,
        ].every(isNonEmptyString);
        const hasCurrentAddress =
            isNonEmptyString(address.region) && isNonEmptyString(address.address);
        const hasLegacyAddress =
            isNonEmptyString(address.street) &&
            isNonEmptyString(address.city) &&
            isNonEmptyString(address.state);

        if (!hasCustomerDetails || (!hasCurrentAddress && !hasLegacyAddress)) {
            return res.status(400).json({
                message: "Please provide complete shipping details."
            });
        }

        let stockRequirements;
        try {
            stockRequirements = getOrderStockRequirements(products);
        } catch (validationError) {
            return res.status(validationError.statusCode || 400).json({
                message: validationError.message
            });
        }

        if (paymentMethod !== "cash_on_delivery") {
            return res.status(400).json({
                message: "The selected payment method is not supported."
            });
        }

        const idempotencyKey = String(
            req.get?.("Idempotency-Key") ||
            req.headers?.["idempotency-key"] ||
            ""
        ).trim();
        if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
            return res.status(400).json({
                message: "A valid Idempotency-Key header is required to place an order.",
            });
        }

        const fingerprint = getOrderRequestFingerprint({
            products,
            totalAmount,
            address,
            paymentMethod,
        });
        const orderId = new mongoose.Types.ObjectId();

        try {
            idempotencyRecord = await orderIdempotencyModel.create({
                user: req.user.id,
                key: idempotencyKey,
                fingerprint,
                orderId,
            });
        } catch (error) {
            if (error.code !== 11000) throw error;

            const existingRecord = await orderIdempotencyModel.findOne({
                user: req.user.id,
                key: idempotencyKey,
            });
            if (!existingRecord) throw error;

            if (existingRecord.fingerprint !== fingerprint) {
                return res.status(409).json({
                    code: "IDEMPOTENCY_KEY_REUSED",
                    message: "This checkout key was already used for a different order.",
                });
            }

            const existingOrder = await orderModel.findById(existingRecord.orderId);
            if (existingOrder) {
                return res.status(201).json({
                    message: "Order created successfully",
                    order: existingOrder,
                });
            }

            return res.status(409).json({
                code: "ORDER_IN_PROGRESS",
                message: "This order is still being processed. Please retry with the same checkout.",
            });
        }

        {
            const reservedStock = await reserveOrderStock(stockRequirements);
            let order;
            try {
                order = new orderModel({
                    _id: orderId,
                    user: req.user.id,
                    products,
                    totalAmount,
                    paymentMethod,
                    address,
                    timeline: [{
                        status: "pending",
                        changedAt: new Date()
                    }]
                });
                await order.save();
                orderSaved = true;
                savedOrder = order;
            } catch (saveError) {
                try {
                    await restoreOrderStock(reservedStock);
                } catch (restoreError) {
                    console.error("Restore Stock After Order Save Error:", restoreError);
                    throw new Error("Unable to restore inventory after saving the order failed.");
                }
                throw saveError;
            }
            res.status(201).json({
                message: "Order created successfully",
                order,
            });

            void (async () => {
                try {
                    publishUpdate({ type: "products:changed" });
                    publishUpdate({ type: "order:changed", userId: req.user.id });
                } catch (updateError) {
                    console.error("Publish Order Updates Error:", updateError);
                }
            })();

            void (async () => {
                try {
                    await adminNotificationModel.create({
                        type: "order",
                        title: "New Order Received",
                        message: `${req.user.username} (${req.user.email}) placed order #${order._id} for ৳${order.totalAmount.toFixed(2)} with Cash on Delivery.`,
                        user: req.user.id,
                        userName: req.user.username,
                        userEmail: req.user.email,
                        order: order._id,
                    });
                    publishUpdate({ type: "notifications:changed" });
                } catch (notificationError) {
                    console.error("Create Order Notification Error:", notificationError);
                }
            })();

            void (async () => {
                try {
                    await customerNotificationService.notifyAdministrators({
                        type: "order",
                        title: "New order received",
                        message: `${req.user.username || "A customer"} placed order #${order._id}.`,
                        relatedId: order._id,
                        to: "/orders",
                        sourceKey: `admin-order:${order._id}`,
                    });
                } catch (notificationError) {
                    console.error("Create App Order Notification Error:", notificationError);
                }
            })();

            void (async () => {
                try {
                    const configuredFrontendUrl = new URL(
                        process.env.FRONTEND_URL || "http://localhost:5173"
                    );
                    if (!["http:", "https:"].includes(configuredFrontendUrl.protocol)) {
                        throw new Error("FRONTEND_URL must use HTTP or HTTPS.");
                    }
                    const myOrdersUrl = new URL(
                        "/my-orders",
                        configuredFrontendUrl.origin
                    ).toString();
                    const customerName = req.user.username || address.fullName || "Customer";
                    const orderId = String(order._id);
                    const formattedTotalAmount = Number(order.totalAmount).toFixed(2);
                    const shippingRegion =
                        address.region ||
                        [address.city, address.state].filter(Boolean).join(", ");
                    const shippingAddress = [
                        address.address || address.street,
                        shippingRegion,
                    ].filter(Boolean).join(", ");
                    const message = [
                        `Dear ${customerName},`,
                        "",
                        "Thank you for your order! It has been successfully placed.",
                        `Order ID: #${orderId}`,
                        `Total: ৳${formattedTotalAmount}`,
                        `Payment: ${paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : paymentMethod}`,
                        `Shipping address: ${shippingAddress}`,
                        "",
                        "Track your order in My Orders:",
                        myOrdersUrl,
                        "",
                        "Thank you for shopping with MAVO!"
                    ].join("\n");
                    const emailHtml = `
                <!doctype html>
                <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <meta name="color-scheme" content="light">
                        <title>Order confirmed</title>
                    </head>
                    <body style="margin:0; padding:0; background-color:#f5f5f4; font-family:Arial, Helvetica, sans-serif; color:#292524;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f4; padding:32px 12px;">
                            <tr>
                                <td align="center">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e7e5e4; border-radius:12px; overflow:hidden;">
                                        <tr>
                                            <td style="padding:24px 32px; background-color:#1c1917;">
                                                <p style="margin:0; color:#ffffff; font-family:Georgia, 'Times New Roman', serif; font-size:28px; letter-spacing:1px;">MAVO<span style="color:#b91c1c;">.</span></p>
                                                <p style="margin:6px 0 0; color:#d6d3d1; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Order confirmation</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:36px 32px 12px;">
                                                <div style="display:inline-block; padding:6px 11px; border-radius:20px; background-color:#ecfdf5; color:#047857; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Order placed</div>
                                                <h1 style="margin:18px 0 12px; color:#1c1917; font-family:Georgia, 'Times New Roman', serif; font-size:30px; font-weight:normal; line-height:1.25;">Thank you for your order</h1>
                                                <p style="margin:0; color:#57534e; font-size:15px; line-height:1.7;">Hello ${escapeHtml(customerName)}, your order is confirmed. We’ll keep you updated as it makes its way to you.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:20px 32px 8px;">
                                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e7e5e4; border-radius:8px; background-color:#fafaf9;">
                                                    <tr>
                                                        <td style="padding:18px 20px; border-bottom:1px solid #e7e5e4;">
                                                            <p style="margin:0 0 6px; color:#78716c; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Order number</p>
                                                            <p style="margin:0; color:#1c1917; font-size:15px; font-weight:bold;">#${escapeHtml(orderId)}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:18px 20px;">
                                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                <tr>
                                                                    <td style="padding:0 12px 12px 0; color:#78716c; font-size:13px;">Total</td>
                                                                    <td align="right" style="padding:0 0 12px; color:#1c1917; font-size:14px; font-weight:bold;">৳${escapeHtml(formattedTotalAmount)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding:0 12px 12px 0; color:#78716c; font-size:13px;">Payment</td>
                                                                    <td align="right" style="padding:0 0 12px; color:#1c1917; font-size:13px;">Cash on Delivery</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding:0 12px 0 0; color:#78716c; font-size:13px; vertical-align:top;">Delivering to</td>
                                                                    <td align="right" style="padding:0; color:#1c1917; font-size:13px; line-height:1.6;">${escapeHtml(address.fullName)}<br>${escapeHtml(shippingAddress)}</td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="padding:24px 32px 34px;">
                                                <p style="margin:0 0 18px; color:#57534e; font-size:14px; line-height:1.6;">You can check the latest status of your purchase anytime.</p>
                                                <a href="${escapeHtml(myOrdersUrl)}" style="display:inline-block; padding:14px 30px; border:1px solid #1c1917; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">Track Order</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:18px 32px; border-top:1px solid #e7e5e4; background-color:#fafaf9;">
                                                <p style="margin:0; color:#78716c; font-size:12px; line-height:1.6;">Thank you for shopping with MAVO.<br>This is an automated order confirmation; please do not reply to this email.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
                    `;

                    await emailUtils.sendEmail(
                        req.user.email,
                        "Order Confirmation",
                        message,
                        emailHtml
                    );
                } catch (emailError) {
                    console.error("Send Order Confirmation Email Error:", emailError);
                }
            })();

            return;
        }

    } catch (error) {
        if (orderSaved) {
            if (res.headersSent) {
                console.error("Order response was already sent:", error);
                return;
            }
            return res.status(201).json({
                message: "Order created successfully",
                order: savedOrder,
            });
        }

        if (idempotencyRecord) {
            try {
                await orderIdempotencyModel.deleteOne({
                    _id: idempotencyRecord._id,
                });
            } catch (cleanupError) {
                console.error("Clear Failed Order Idempotency Record Error:", cleanupError);
            }
        }

        return res.status(error.statusCode || 500).json({
            message: error.message
        });
    }
}

/**
 * @name getOrderById
 * @description Get order details by ID
 * @access private (User only)
 */
async function getOrderById(req, res) {
    try {
        const order = await orderModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate("products.product", "title productName mainImage");
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }
        res.status(200).json({
            message: "Order found",
            order
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

/**
 * @name cancelMyOrder
 * @description Cancel a pending order owned by the logged-in user
 * @access private (User only)
 */
async function cancelMyOrder(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: "A valid order ID is required."
        });
    }

    const changedAt = new Date();
    try {
        const order = await orderModel.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id,
                status: "pending"
            },
            {
                $set: { status: "cancelled" },
                $push: { timeline: { status: "cancelled", changedAt } }
            },
            { new: true, runValidators: true }
        );

        if (!order) {
            const existingOrder = await orderModel.findOne({
                _id: req.params.id,
                user: req.user.id
            });

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found."
                });
            }

            return res.status(409).json({
                message: "Only pending orders can be cancelled."
            });
        }

        publishUpdate({ type: "order:changed", userId: req.user.id });

        try {
            await restoreOrderStock(getOrderStockRequirements(order.products));
        } catch (stockError) {
            console.error("Restore Cancelled Order Stock Error:", stockError);
            return res.status(500).json({
                message: "Order was cancelled, but inventory could not be restored. Please contact support."
            });
        }

        publishUpdate({ type: "products:changed" });
        return res.status(200).json({
            message: "Order cancelled successfully.",
            orderId: String(order._id),
            status: order.status,
            changedAt: changedAt.toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

/**
 * @name deleteMyOrder
 * @description Delete a delivered or cancelled order owned by the logged-in user
 * @access private (User only)
 */
async function deleteMyOrder(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: "A valid order ID is required."
        });
    }

    try {
        const allowedStatuses = ["cancelled", "delivered"];
        const orderFilter = {
            _id: req.params.id,
            user: req.user.id,
            status: { $in: allowedStatuses }
        };
        const order = await orderModel.findOneAndDelete(orderFilter);

        if (!order) {
            const existingOrder = await orderModel.findOne({
                _id: req.params.id,
                user: req.user.id
            });

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found."
                });
            }

            return res.status(409).json({
                message: "Only cancelled or delivered orders can be deleted."
            });
        }

        try {
            await adminNotificationModel.deleteMany({
                order: order._id,
                type: "order"
            });
        } catch (notificationError) {
            console.error("Clean Up Order Notification Error:", notificationError);
        }

        publishUpdate({ type: "order:changed", userId: req.user.id });
        return res.status(200).json({
            message: "Order deleted successfully.",
            orderId: String(order._id)
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

/**
 * @name getAllOrders
 * @description Get all orders (Admin only)
 * @access private (Admin only)
 */
async function getAllOrders(req, res) {
    try {
        const orders = await orderModel
            .find()
            .sort({ createdAt: -1 })
            .populate("user", "username email")
            .populate("products.product", "title productName price mainImage sku");
        res.status(200).json({
            message: "Orders found",
            orders
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

/**
 * @name deleteOrder
 * @description Delete an order (Admin only)
 * @access private (Admin only)
 */
async function deleteOrder(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: "A valid order ID is required."
        });
    }

    try {
        const order = await orderModel.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        try {
            await adminNotificationModel.deleteMany({
                order: order._id,
                type: "order"
            });
        } catch (notificationError) {
            console.error("Clean Up Deleted Order Notifications Error:", notificationError);
        }

        publishUpdate({ type: "order:changed", userId: order.user });
        publishUpdate({ type: "notifications:changed" });

        return res.status(200).json({
            message: "Order deleted successfully.",
            orderId: String(order._id)
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}


/**
 * @name updateOrderStatus
 * @description Update order status (Admin only)
 * @access private (Admin only)
 */
async function updateOrderStatus(req, res) {
    try {
        const { status } = req.body;
        const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status."
            });
        }

        const order = await orderModel.findById(req.params.id);
        if (order) {
            const statusChanged = order.status !== status;
            let myOrdersUrl;
            if (statusChanged) {
                try {
                    const configuredFrontendUrl = new URL(
                        process.env.FRONTEND_URL || "http://localhost:5173"
                    );
                    if (!["http:", "https:"].includes(configuredFrontendUrl.protocol)) {
                        throw new Error("FRONTEND_URL must use HTTP or HTTPS.");
                    }
                    myOrdersUrl = new URL("/my-orders", configuredFrontendUrl.origin).toString();
                } catch (configurationError) {
                    console.error("Invalid FRONTEND_URL for order status email:", configurationError);
                    return res.status(500).json({
                        message: "The My Orders page URL is not configured correctly. The order status was not updated."
                    });
                }

                order.status = status;
                order.timeline.push({
                    status,
                    changedAt: new Date()
                });
                await order.save();
                const timelineUpdate = order.timeline[order.timeline.length - 1];
                try {
                    await customerNotificationService.createNotification({
                        recipient: order.user,
                        type: "order",
                        title: `Order #${String(order._id).slice(-8)} updated`,
                        message: `Your order status is now ${status}.`,
                        relatedId: order._id,
                        to: "/my-orders",
                        sourceKey: `order:${order._id}:${timelineUpdate._id || order.timeline.length - 1}`,
                    });
                } catch (notificationError) {
                    console.error("Create Customer Order Notification Error:", notificationError);
                }
                if (status === "delivered") {
                    try {
                        await customerNotificationService.notifyCustomerToReviewDeliveredOrder(order);
                    } catch (notificationError) {
                        console.error("Create Delivered Order Review Notifications Error:", notificationError);
                    }
                }
                if (status === "delivered") {
                    publishUpdate({ type: "products:changed" });
                }
                publishUpdate({ type: "order:changed", userId: order.user });
            }
            await order.populate([
                { path: "user", select: "username email" },
                { path: "products.product", select: "title productName price mainImage sku" }
            ]);

            let emailWarning;
            if (statusChanged) {
                const customerName = order.user?.username || order.address.fullName || "Customer";
                const recipientEmail = order.user?.email || order.address.email;
                const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
                const orderId = String(order._id);
                const reviewLinks = status === "delivered"
                    ? [...new Map(
                        order.products
                            .filter((item) => item.product?._id)
                            .map((item) => [
                                String(item.product._id),
                                {
                                    productId: String(item.product._id),
                                    productName: item.product.title || item.product.productName || "your product",
                                },
                            ])
                    ).values()].map((item) => ({
                        ...item,
                        url: new URL(
                            `/my-orders/${orderId}/review/${item.productId}`,
                            new URL(myOrdersUrl).origin
                        ).toString(),
                    }))
                    : [];
                const emailText = [
                    `Hello ${customerName},`,
                    "",
                    `Your order status has been updated to: ${formattedStatus}.`,
                    `Order ID: #${orderId}`,
                    ...(reviewLinks.length
                        ? [
                            "",
                            "We hope you love your purchase. Please leave a review:",
                            ...reviewLinks.map((item) => `${item.productName}: ${item.url}`),
                        ]
                        : []),
                    "",
                    "Track your order in My Orders:",
                    myOrdersUrl,
                    "",
                    "Thank you for shopping with MAVO."
                ].join("\n");
                const reviewButtons = reviewLinks.map((item) => `
                    <p style="margin:12px 0; color:#57534e; font-size:14px;">${escapeHtml(item.productName)}</p>
                    <a href="${escapeHtml(item.url)}" style="display:inline-block; padding:12px 24px; border:1px solid #1c1917; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">Review</a>
                `).join("");
                const emailHtml = `
                    <!doctype html>
                    <html lang="en">
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <meta name="color-scheme" content="light">
                            <title>Order status update</title>
                        </head>
                        <body style="margin:0; padding:0; background-color:#f5f5f4; font-family:Arial, Helvetica, sans-serif; color:#292524;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f4; padding:32px 12px;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e7e5e4; border-radius:12px; overflow:hidden;">
                                            <tr>
                                                <td style="padding:24px 32px; background-color:#1c1917;">
                                                    <p style="margin:0; color:#ffffff; font-family:Georgia, 'Times New Roman', serif; font-size:28px; letter-spacing:1px;">MAVO<span style="color:#b91c1c;">.</span></p>
                                                    <p style="margin:6px 0 0; color:#d6d3d1; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Order update</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:36px 32px 12px;">
                                                    <div style="display:inline-block; padding:6px 11px; border-radius:20px; background-color:#f5f5f4; color:#57534e; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Status update</div>
                                                    <h1 style="margin:18px 0 12px; color:#1c1917; font-family:Georgia, 'Times New Roman', serif; font-size:30px; font-weight:normal; line-height:1.25;">Your order is now ${escapeHtml(formattedStatus.toLowerCase())}</h1>
                                                    <p style="margin:0; color:#57534e; font-size:15px; line-height:1.7;">Hello ${escapeHtml(customerName)}, the status of your order has changed. You can view the latest details in your orders.</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:20px 32px 8px;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e7e5e4; border-radius:8px; background-color:#fafaf9;">
                                                        <tr>
                                                            <td style="padding:18px 20px;">
                                                                <p style="margin:0 0 6px; color:#78716c; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Order ID</p>
                                                                <p style="margin:0; color:#1c1917; font-size:16px; font-weight:bold; word-break:break-all;">#${escapeHtml(orderId)}</p>
                                                            </td>
                                                            <td align="right" style="padding:18px 20px;">
                                                                <span style="display:inline-block; padding:6px 10px; border-radius:20px; background-color:#f5f5f4; color:#292524; font-size:12px; font-weight:bold;">${escapeHtml(formattedStatus)}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ${reviewLinks.length ? `
                                                <tr>
                                                    <td style="padding:20px 32px 8px; text-align:center;">
                                                        <h2 style="margin:0 0 8px; color:#1c1917; font-size:20px;">How was your purchase?</h2>
                                                        <p style="margin:0 0 16px; color:#57534e; font-size:14px; line-height:1.6;">Share a rating, comment, and photos or video of each product.</p>
                                                        ${reviewButtons}
                                                    </td>
                                                </tr>
                                            ` : ""}
                                            <tr>
                                                <td align="center" style="padding:24px 32px 34px;">
                                                    <p style="margin:0 0 18px; color:#57534e; font-size:14px; line-height:1.6;">Track your order and see its latest details.</p>
                                                    <a href="${escapeHtml(myOrdersUrl)}" style="display:inline-block; padding:14px 30px; border:1px solid #1c1917; border-radius:6px; background-color:#1c1917; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">Track Order</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:18px 32px; border-top:1px solid #e7e5e4; background-color:#fafaf9;">
                                                    <p style="margin:0; color:#78716c; font-size:12px; line-height:1.6;">Thank you for shopping with MAVO.<br>This is an automated order update; please do not reply to this email.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                    </html>
                `;

                try {
                    await emailUtils.sendEmail(
                        recipientEmail,
                        `Order Update: ${formattedStatus}`,
                        emailText,
                        emailHtml
                    );
                } catch (emailError) {
                    console.error("Send Order Status Email Error:", emailError);
                    emailWarning = " The status was updated, but the notification email could not be sent.";
                }
            }

            return res.status(200).json({
                message: `Order status updated successfully.${emailWarning || ""}`,
                emailSent: statusChanged && !emailWarning,
                ...(emailWarning && { warning: emailWarning.trim() }),
                order
            });
        } else {
            return res.status(404).json({
                message: "Order not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

module.exports = {
    createOrder,
    getOrderStockRequirements,
    reserveOrderStock,
    getOrderById,
    cancelMyOrder,
    deleteMyOrder,
    getAllOrders,
    deleteOrder,
    updateOrderStatus
};