const mongoose = require("mongoose");
const cloudinary = require("../config/cloudnary");
const orderModel = require("../models/order.model");
const productModel = require("../models/productUpload.model");
const productReviewModel = require("../models/productReview.model");
const productReviewVoteModel = require("../models/productReviewVote.model");
const productReviewReplyModel = require("../models/productReviewReply.model");
const customerNotificationModel = require("../models/customerNotification.model");
const customerNotificationService = require("../utils/customerNotificationService");
const { publishUpdate } = require("../utils/liveUpdates");

async function notifyReviewAuthor(review, actorId, sourceKey, title, description) {
    if (String(review.user) === String(actorId)) return;

    await customerNotificationService.createNotification({
        recipient: review.user,
        sourceKey,
        type: "review-activity",
        title,
        message: description,
        relatedId: review.product,
        to: `/product/${review.product}#review-${review._id}`,
    });
}

function validateIds(req, res) {
    if (
        !mongoose.isValidObjectId(req.params.orderId) ||
        !mongoose.isValidObjectId(req.params.productId)
    ) {
        res.status(400).json({ message: "Valid order and product IDs are required." });
        return false;
    }
    return true;
}

async function findDeliveredOrderItem(userId, orderId, productId) {
    return orderModel.findOne({
        _id: orderId,
        user: userId,
        status: "delivered",
        "products.product": productId,
    });
}

async function getReviewEligibility(req, res) {
    if (!validateIds(req, res)) return;

    try {
        const [order, product] = await Promise.all([
            findDeliveredOrderItem(req.user.id, req.params.orderId, req.params.productId),
            productModel.findById(req.params.productId)
                .select("_id title mainImage brandName category"),
        ]);
        if (!order || !product) {
            return res.status(404).json({
                message: "A delivered order containing this product is required to review it.",
            });
        }

        const review = await productReviewModel.findOne({
            order: order._id,
            product: product._id,
            user: req.user.id,
        }).lean();

        return res.status(200).json({
            eligible: true,
            product: {
                id: String(product._id),
                title: product.title,
                image: product.mainImage,
                brandName: product.brandName,
                category: product.category,
            },
            review: review
                ? {
                    id: String(review._id),
                    rating: review.rating,
                    comment: review.comment,
                    media: review.media.map(({ url, type }) => ({ url, type })),
                    createdAt: review.createdAt,
                }
                : null,
        });
    } catch (error) {
        console.error("Get Product Review Eligibility Error:", error);
        return res.status(500).json({ message: "Unable to load review details." });
    }
}

async function getProductReviews(req, res) {
    if (!mongoose.isValidObjectId(req.params.productId)) {
        return res.status(400).json({ message: "A valid product ID is required." });
    }

    try {
        const reviews = await productReviewModel.find({ product: req.params.productId })
            .populate("user", "username")
            .populate("product", "_id")
            .sort({ createdAt: -1 })
            .lean();
        const reviewIds = reviews.map((review) => review._id);
        const [votes, replies] = await Promise.all([
            productReviewVoteModel.find({ review: { $in: reviewIds } })
                .select("review user value")
                .lean(),
            productReviewReplyModel.find({ review: { $in: reviewIds } })
                .populate("user", "username")
                .sort({ createdAt: 1 })
                .lean(),
        ]);
        const votesByReview = new Map();
        for (const vote of votes) {
            const reviewId = String(vote.review);
            const counts = votesByReview.get(reviewId) || {
                likes: 0,
                dislikes: 0,
                userVote: null,
            };
            if (vote.value === "like") counts.likes += 1;
            else counts.dislikes += 1;
            if (req.user?.id && String(vote.user) === String(req.user.id)) {
                counts.userVote = vote.value;
            }
            votesByReview.set(reviewId, counts);
        }
        const repliesByReview = new Map();
        for (const reply of replies) {
            const reviewId = String(reply.review);
            const reviewReplies = repliesByReview.get(reviewId) || [];
            reviewReplies.push({
                id: String(reply._id),
                parentReplyId: reply.parentReply ? String(reply.parentReply) : null,
                userId: String(reply.user?._id || reply.user),
                userName: reply.user?.username || "Customer",
                comment: reply.comment,
                createdAt: reply.createdAt,
                replies: [],
            });
            repliesByReview.set(reviewId, reviewReplies);
        }
        for (const reviewReplies of repliesByReview.values()) {
            const repliesById = new Map(
                reviewReplies.map((reply) => [reply.id, reply])
            );
            for (const reply of reviewReplies) {
                if (!reply.parentReplyId) continue;
                const parentReply = repliesById.get(reply.parentReplyId);
                if (parentReply) {
                    parentReply.replies.push(reply);
                }
            }
        }

        return res.status(200).json({
            reviews: reviews.map((review) => ({
                id: String(review._id),
                productId: String(review.product?._id || review.product),
                userId: String(review.user?._id || review.user),
                userName: review.user?.username || "Customer",
                rating: review.rating,
                comment: review.comment,
                media: review.media.map(({ url, type }) => ({ url, type })),
                createdAt: review.createdAt,
                ...(
                    votesByReview.get(String(review._id)) || {
                        likes: 0,
                        dislikes: 0,
                        userVote: null,
                    }
                ),
                replies: (repliesByReview.get(String(review._id)) || [])
                    .filter((reply) => !reply.parentReplyId),
            })),
        });
    } catch (error) {
        console.error("Get Product Reviews Error:", error);
        return res.status(500).json({ message: "Unable to load product reviews." });
    }
}

async function getAdminProductReviews(req, res) {
    try {
        const reviews = await productReviewModel.find({})
            .populate("user", "username email")
            .populate("product", "_id title mainImage")
            .populate("order", "_id")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            reviews: reviews.map((review) => ({
                id: String(review._id),
                userId: String(review.user?._id || review.user || ""),
                userName: review.user?.username || "Customer",
                userEmail: review.user?.email || "",
                productId: String(review.product?._id || review.product || ""),
                productName: review.product?.title || "Deleted product",
                productImage: review.product?.mainImage || "",
                orderId: String(review.order?._id || review.order || ""),
                rating: review.rating,
                comment: review.comment,
                media: (review.media || []).map(({ url, type }) => ({ url, type })),
                createdAt: review.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get Admin Product Reviews Error:", error);
        return res.status(500).json({ message: "Unable to load reviews." });
    }
}

async function voteOnProductReview(req, res) {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
        return res.status(400).json({ message: "A valid review ID is required." });
    }
    const { vote } = req.body;
    if (!["like", "dislike"].includes(vote)) {
        return res.status(400).json({ message: "Vote must be like or dislike." });
    }

    try {
        const review = await productReviewModel.findById(req.params.reviewId)
            .select("_id user product");
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        const existingVote = await productReviewVoteModel.findOne({
            review: review._id,
            user: req.user.id,
        });
        let userVote = vote;
        if (existingVote?.value === vote) {
            await productReviewVoteModel.deleteOne({ _id: existingVote._id });
            userVote = null;
        } else if (existingVote) {
            existingVote.value = vote;
            await existingVote.save();
        } else {
            try {
                await productReviewVoteModel.create({
                    review: review._id,
                    user: req.user.id,
                    value: vote,
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
                await productReviewVoteModel.updateOne(
                    { review: review._id, user: req.user.id },
                    { $set: { value: vote } }
                );
            }
        }

        if (userVote) {
            await notifyReviewAuthor(
                review,
                req.user.id,
                `review-vote:${review._id}:${req.user.id}:${vote}`,
                vote === "like" ? "Someone liked your review" : "Someone disliked your review",
                `${req.user.username || "A customer"} ${vote === "like" ? "liked" : "disliked"} your review.`
            );
        }

        const [likes, dislikes] = await Promise.all([
            productReviewVoteModel.countDocuments({ review: review._id, value: "like" }),
            productReviewVoteModel.countDocuments({ review: review._id, value: "dislike" }),
        ]);
        return res.status(200).json({ likes, dislikes, userVote });
    } catch (error) {
        console.error("Vote on Product Review Error:", error);
        return res.status(500).json({ message: "Unable to update your vote." });
    }
}

async function replyToProductReview(req, res) {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
        return res.status(400).json({ message: "A valid review ID is required." });
    }
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!comment || comment.length > 1000) {
        return res.status(400).json({
            message: "A reply of 1 to 1000 characters is required.",
        });
    }

    try {
        const review = await productReviewModel.findById(req.params.reviewId)
            .select("_id user product");
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        const parentReplyId = req.body.parentReplyId || null;
        if (parentReplyId && !mongoose.isValidObjectId(parentReplyId)) {
            return res.status(400).json({ message: "A valid reply ID is required." });
        }
        if (parentReplyId) {
            const parentReply = await productReviewReplyModel.findOne({
                _id: parentReplyId,
                review: review._id,
            }).select("_id");
            if (!parentReply) {
                return res.status(404).json({ message: "Reply not found." });
            }
        }

        const reply = await productReviewReplyModel.create({
            review: review._id,
            parentReply: parentReplyId,
            user: req.user.id,
            comment,
        });
        const populatedReply = await productReviewReplyModel.findById(reply._id)
            .populate("user", "username")
            .lean();
        await notifyReviewAuthor(
            review,
            req.user.id,
            `review-reply:${reply._id}`,
            "Someone replied to your review",
            `${req.user.username || "A customer"} replied to your review.`
        );
        publishUpdate({ type: "reviews:changed" });

        return res.status(201).json({
            reply: {
                id: String(populatedReply._id),
                parentReplyId: populatedReply.parentReply
                    ? String(populatedReply.parentReply)
                    : null,
                userId: String(populatedReply.user?._id || req.user.id),
                userName: populatedReply.user?.username || "Customer",
                comment: populatedReply.comment,
                createdAt: populatedReply.createdAt,
                replies: [],
            },
        });
    } catch (error) {
        console.error("Reply to Product Review Error:", error);
        return res.status(500).json({ message: "Unable to submit your reply." });
    }
}

async function updateProductReview(req, res) {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
        return res.status(400).json({ message: "A valid review ID is required." });
    }

    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }
    if (!comment || comment.length > 2000) {
        return res.status(400).json({ message: "A comment of 1 to 2000 characters is required." });
    }

    try {
        const review = await productReviewModel.findOneAndUpdate(
            { _id: req.params.reviewId, user: req.user.id },
            { $set: { rating, comment } },
            { new: true, runValidators: true }
        );
        if (!review) {
            return res.status(404).json({ message: "Review not found or you do not own it." });
        }

        publishUpdate({ type: "products:changed" });
        publishUpdate({ type: "reviews:changed" });
        return res.status(200).json({
            review: {
                id: String(review._id),
                rating: review.rating,
                comment: review.comment,
                updatedAt: review.updatedAt,
            },
        });
    } catch (error) {
        console.error("Update Product Review Error:", error);
        return res.status(500).json({ message: "Unable to update your review." });
    }
}

async function cleanupDeletedProductReview(review) {
    const replies = await productReviewReplyModel.find({ review: review._id })
        .select("_id")
        .lean();
    await Promise.all([
        productReviewVoteModel.deleteMany({ review: review._id }),
        productReviewReplyModel.deleteMany({ review: review._id }),
        customerNotificationModel.deleteMany({
            $or: [
                { sourceKey: { $regex: `^review-vote:${review._id}:` } },
                { sourceKey: { $in: replies.map(({ _id }) => `review-reply:${_id}`) } },
            ],
        }),
    ]);
    await removeUploadedMedia(review.media || []);
    publishUpdate({ type: "products:changed" });
    publishUpdate({ type: "reviews:changed" });
    publishUpdate({
        type: "customer-notifications:changed",
        userId: String(review.user),
    });
}

async function deleteProductReview(req, res) {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
        return res.status(400).json({ message: "A valid review ID is required." });
    }

    try {
        const review = await productReviewModel.findOneAndDelete({
            _id: req.params.reviewId,
            user: req.user.id,
        });
        if (!review) {
            return res.status(404).json({ message: "Review not found or you do not own it." });
        }

        await cleanupDeletedProductReview(review);
        return res.status(200).json({ message: "Review deleted." });
    } catch (error) {
        console.error("Delete Product Review Error:", error);
        return res.status(500).json({ message: "Unable to delete your review." });
    }
}

async function deleteAdminProductReview(req, res) {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
        return res.status(400).json({ message: "A valid review ID is required." });
    }

    try {
        const review = await productReviewModel.findByIdAndDelete(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        await cleanupDeletedProductReview(review);
        return res.status(200).json({ message: "Review and its replies deleted." });
    } catch (error) {
        console.error("Delete Admin Product Review Error:", error);
        return res.status(500).json({ message: "Unable to delete the review." });
    }
}

async function updateProductReviewReply(req, res) {
    if (
        !mongoose.isValidObjectId(req.params.reviewId) ||
        !mongoose.isValidObjectId(req.params.replyId)
    ) {
        return res.status(400).json({ message: "Valid review and reply IDs are required." });
    }
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!comment || comment.length > 1000) {
        return res.status(400).json({ message: "A reply of 1 to 1000 characters is required." });
    }

    try {
        const reply = await productReviewReplyModel.findOneAndUpdate(
            {
                _id: req.params.replyId,
                review: req.params.reviewId,
                user: req.user.id,
            },
            { $set: { comment } },
            { new: true, runValidators: true }
        );
        if (!reply) {
            return res.status(404).json({ message: "Reply not found or you do not own it." });
        }
        publishUpdate({ type: "reviews:changed" });
        return res.status(200).json({
            reply: {
                id: String(reply._id),
                comment: reply.comment,
                updatedAt: reply.updatedAt,
            },
        });
    } catch (error) {
        console.error("Update Product Review Reply Error:", error);
        return res.status(500).json({ message: "Unable to update your reply." });
    }
}

async function deleteProductReviewReply(req, res) {
    if (
        !mongoose.isValidObjectId(req.params.reviewId) ||
        !mongoose.isValidObjectId(req.params.replyId)
    ) {
        return res.status(400).json({ message: "Valid review and reply IDs are required." });
    }

    try {
        const reply = await productReviewReplyModel.findOneAndDelete({
            _id: req.params.replyId,
            review: req.params.reviewId,
            user: req.user.id,
        });
        if (!reply) {
            return res.status(404).json({ message: "Reply not found or you do not own it." });
        }

        const descendantIds = [];
        let parentIds = [reply._id];
        while (parentIds.length) {
            const descendants = await productReviewReplyModel.find({
                review: req.params.reviewId,
                parentReply: { $in: parentIds },
            }).select("_id").lean();
            parentIds = descendants.map(({ _id }) => _id);
            descendantIds.push(...parentIds);
        }
        if (descendantIds.length) {
            await productReviewReplyModel.deleteMany({
                _id: { $in: descendantIds },
            });
        }
        await customerNotificationModel.deleteMany({
            sourceKey: {
                $in: [reply._id, ...descendantIds].map((replyId) => `review-reply:${replyId}`),
            },
        });
        publishUpdate({ type: "reviews:changed" });
        return res.status(200).json({ message: "Reply deleted." });
    } catch (error) {
        console.error("Delete Product Review Reply Error:", error);
        return res.status(500).json({ message: "Unable to delete your reply." });
    }
}

function uploadReviewMedia(file) {
    const type = file.mimetype.startsWith("video/") ? "video" : "image";
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "mavo/reviews",
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result?.secure_url || !result.public_id) {
                    return reject(new Error("Media upload returned an invalid response."));
                }
                return resolve({
                    url: result.secure_url,
                    type,
                    publicId: result.public_id,
                });
            }
        );
        stream.end(file.buffer);
    });
}

async function removeUploadedMedia(media) {
    for (const item of media) {
        try {
            await cloudinary.uploader.destroy(item.publicId, {
                resource_type: item.type === "video" ? "video" : "image",
            });
        } catch (error) {
            console.error("Remove Unattached Review Media Error:", error);
        }
    }
}

async function createProductReview(req, res) {
    if (!validateIds(req, res)) return;

    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }
    if (!comment || comment.length > 2000) {
        return res.status(400).json({
            message: "A comment of 1 to 2000 characters is required.",
        });
    }

    const files = req.files || [];
    if (files.length > 3) {
        return res.status(400).json({ message: "You can attach up to 3 photos or videos." });
    }

    try {
        const order = await findDeliveredOrderItem(
            req.user.id,
            req.params.orderId,
            req.params.productId
        );
        if (!order) {
            return res.status(403).json({
                message: "Only customers with a delivered order for this product can review it.",
            });
        }

        const existingReview = await productReviewModel.exists({
            order: order._id,
            product: req.params.productId,
        });
        if (existingReview) {
            return res.status(409).json({ message: "You have already reviewed this product for this order." });
        }

        const uploadedMedia = [];
        try {
            for (const file of files) {
                uploadedMedia.push(await uploadReviewMedia(file));
            }

            const review = await productReviewModel.create({
                order: order._id,
                product: req.params.productId,
                user: req.user.id,
                rating,
                comment,
                media: uploadedMedia,
            });
            publishUpdate({ type: "products:changed" });
            publishUpdate({ type: "reviews:changed" });

            return res.status(201).json({
                message: "Your review has been submitted.",
                review: {
                    id: String(review._id),
                    rating: review.rating,
                    comment: review.comment,
                    media: review.media.map(({ url, type }) => ({ url, type })),
                    createdAt: review.createdAt,
                },
            });
        } catch (error) {
            await removeUploadedMedia(uploadedMedia);
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "You have already reviewed this product for this order.",
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Create Product Review Error:", error);
        return res.status(500).json({ message: "Unable to submit your review." });
    }
}

module.exports = {
    getReviewEligibility,
    getProductReviews,
    getAdminProductReviews,
    deleteAdminProductReview,
    createProductReview,
    voteOnProductReview,
    replyToProductReview,
    updateProductReview,
    deleteProductReview,
    updateProductReviewReply,
    deleteProductReviewReply,
};
