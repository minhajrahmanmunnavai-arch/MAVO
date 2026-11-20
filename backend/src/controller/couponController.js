const mongoose = require("mongoose");
const couponModel = require("../models/coupon.model");
const { publishUpdate } = require("../utils/liveUpdates");

function getCouponFields(body = {}) {
    return {
        code: typeof body.code === "string" ? body.code.trim().toUpperCase() : "",
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        minPurchase: Number(body.minPurchase),
        maxDiscount: Number(body.maxDiscount),
        startDate: body.startDate,
        expiryDate: body.expiryDate,
        usageLimit: Number(body.usageLimit),
        status: body.status || "Active",
    };
}

function isValidCoupon(coupon) {
    const startDate = new Date(coupon.startDate);
    const expiryDate = new Date(coupon.expiryDate);
    const validDate = (date) => Number.isFinite(date.getTime());

    return Boolean(
        /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(coupon.code) &&
        ["percentage", "fixed"].includes(coupon.discountType) &&
        Number.isFinite(coupon.discountValue) &&
        coupon.discountValue > 0 &&
        (coupon.discountType !== "percentage" || coupon.discountValue <= 100) &&
        Number.isFinite(coupon.minPurchase) &&
        coupon.minPurchase >= 0 &&
        Number.isFinite(coupon.maxDiscount) &&
        coupon.maxDiscount >= 0 &&
        validDate(startDate) &&
        validDate(expiryDate) &&
        startDate <= expiryDate &&
        Number.isInteger(coupon.usageLimit) &&
        coupon.usageLimit > 0 &&
        ["Active", "Inactive"].includes(coupon.status)
    );
}

function serializeCoupon(coupon) {
    const data = coupon.toObject ? coupon.toObject() : coupon;
    return {
        ...data,
        id: String(data._id),
    };
}

async function getCouponsController(req, res) {
    try {
        const coupons = await couponModel.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json({
            success: true,
            data: coupons.map(serializeCoupon),
        });
    } catch (error) {
        console.error("Unable to load coupons:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load coupons.",
        });
    }
}

async function createCouponController(req, res) {
    const couponFields = getCouponFields(req.body);
    if (!isValidCoupon(couponFields)) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid code, discount, date range, usage limit, and status.",
        });
    }

    try {
        const coupon = await couponModel.create(couponFields);
        publishUpdate({ type: "coupons:changed" });
        return res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            data: serializeCoupon(coupon),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A coupon with this code already exists.",
            });
        }
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Coupon data is invalid.",
            });
        }
        console.error("Unable to create coupon:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create coupon.",
        });
    }
}

async function deleteCouponController(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid coupon ID.",
        });
    }

    try {
        const coupon = await couponModel.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found.",
            });
        }

        publishUpdate({ type: "coupons:changed" });
        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully.",
        });
    } catch (error) {
        console.error("Unable to delete coupon:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete coupon.",
        });
    }
}

module.exports = {
    getCouponsController,
    createCouponController,
    deleteCouponController,
};
