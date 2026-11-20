const userModel = require("../models/user.model");
const orderModel = require("../models/order.model");
const customerModel = require("../models/customer.model");

async function getCustomers(req, res) {
    try {
        const orderSummaries = await orderModel.aggregate([
            { $match: { status: "delivered" } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$user",
                    ordersCount: { $sum: 1 },
                    totalSpent: { $sum: { $ifNull: ["$totalAmount", 0] } },
                    phone: { $first: "$address.phoneNumber" },
                },
            },
        ]);
        const deliveredUserIds = orderSummaries.map((summary) => summary._id);
        const users = await userModel
            .find({ _id: { $in: deliveredUserIds }, role: "user" })
            .select("_id username email createdAt")
            .lean();

        if (users.length > 0) {
            await customerModel.bulkWrite(
                users.map((user) => ({
                    updateOne: {
                        filter: { user: user._id },
                        update: {
                            $setOnInsert: {
                                user: user._id,
                                name: user.username,
                                email: user.email,
                                registeredAt: user.createdAt || null,
                            },
                        },
                        upsert: true,
                    },
                })),
                { ordered: false }
            );
        }

        const customers = users.length > 0
            ? await customerModel
                .find({ user: { $in: users.map((user) => user._id) } })
                .sort({ createdAt: -1 })
                .lean()
            : [];

        const ordersByUserId = new Map(
            orderSummaries.map((summary) => [String(summary._id), summary])
        );

        const result = customers.map((customer) => {
            const orderSummary = ordersByUserId.get(String(customer.user));

            return {
                id: String(customer.user),
                name: customer.name,
                email: customer.email,
                phone: customer.phone || orderSummary?.phone || "",
                ordersCount: orderSummary?.ordersCount || 0,
                totalSpent: orderSummary?.totalSpent || 0,
                status: customer.status,
                registeredAt: customer.registeredAt,
            };
        });

        res.status(200).json({ customers: result });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: "Unable to load customers." });
    }
}

module.exports = { getCustomers };
