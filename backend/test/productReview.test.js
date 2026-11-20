const test = require("node:test");
const assert = require("node:assert/strict");
const reviewController = require("../src/controller/productReviewController");
const orderModel = require("../src/models/order.model");
const productModel = require("../src/models/productUpload.model");
const productReviewModel = require("../src/models/productReview.model");
const productReviewVoteModel = require("../src/models/productReviewVote.model");
const productReviewReplyModel = require("../src/models/productReviewReply.model");
const customerNotificationModel = require("../src/models/customerNotification.model");
const customerNotificationService = require("../src/utils/customerNotificationService");
const cloudinary = require("../src/config/cloudnary");
const authMiddleware = require("../src/middlewares/auth.middleware");
const adminMiddleware = require("../src/middlewares/admin.middleware");
const adminReviewRouter = require("../src/routes/adminReview.routes");

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test("admin review deletion route requires an authenticated administrator", () => {
    const deleteRoute = adminReviewRouter.stack.find(
        (layer) => layer.route?.path === "/:reviewId" && layer.route.methods.delete
    );

    assert.ok(deleteRoute);
    assert.equal(deleteRoute.route.stack[0].handle, authMiddleware.authUser);
    assert.equal(deleteRoute.route.stack[1].handle, adminMiddleware);
});

test("review eligibility returns product details for the mobile review card", async (t) => {
    const userId = "507f1f77bcf86cd799439011";
    const orderId = "507f1f77bcf86cd799439012";
    const productId = "507f1f77bcf86cd799439013";
    const product = {
        _id: productId,
        title: "Desk Lamp",
        mainImage: "https://example.com/lamp.jpg",
        brandName: "MAVO Home",
        category: "Lighting",
    };
    t.mock.method(orderModel, "findOne", async (filter) => {
        assert.deepEqual(filter, {
            _id: orderId,
            user: userId,
            status: "delivered",
            "products.product": productId,
        });
        return { _id: orderId };
    });
    t.mock.method(productModel, "findById", (id) => {
        assert.equal(id, productId);
        return {
            select(fields) {
                assert.equal(fields, "_id title mainImage brandName category");
                return Promise.resolve(product);
            },
        };
    });
    t.mock.method(productReviewModel, "findOne", (filter) => {
        assert.deepEqual(filter, {
            order: orderId,
            product: productId,
            user: userId,
        });
        return { lean: async () => null };
    });
    const response = createResponse();

    await reviewController.getReviewEligibility(
        {
            params: { orderId, productId },
            user: { id: userId },
        },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.product, {
        id: productId,
        title: product.title,
        image: product.mainImage,
        brandName: product.brandName,
        category: product.category,
    });
});

test("admin review listing includes reviewer and product details", async (t) => {
    const review = {
        _id: "507f1f77bcf86cd799439011",
        user: {
            _id: "507f1f77bcf86cd799439012",
            username: "A Customer",
            email: "customer@example.com",
        },
        product: {
            _id: "507f1f77bcf86cd799439013",
            title: "Desk Lamp",
            mainImage: "https://example.com/lamp.jpg",
        },
        order: { _id: "507f1f77bcf86cd799439014" },
        rating: 5,
        comment: "Excellent",
        media: [],
        createdAt: new Date("2026-11-12T06:00:00.000Z"),
    };
    const findReviews = t.mock.method(productReviewModel, "find", (filter) => {
        assert.deepEqual(filter, {});
        return {
            populate() {
                return this;
            },
            sort() {
                return this;
            },
            lean: async () => [review],
        };
    });
    const response = createResponse();

    await reviewController.getAdminProductReviews({}, response);

    assert.equal(findReviews.mock.callCount(), 1);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.reviews[0], {
        id: review._id,
        userId: review.user._id,
        userName: "A Customer",
        userEmail: "customer@example.com",
        productId: review.product._id,
        productName: "Desk Lamp",
        productImage: "https://example.com/lamp.jpg",
        orderId: review.order._id,
        rating: 5,
        comment: "Excellent",
        media: [],
        createdAt: review.createdAt,
    });
});

test("admin review deletion removes associated data and uploaded media", async (t) => {
    const reviewId = "507f1f77bcf86cd799439011";
    const replyId = "507f1f77bcf86cd799439012";
    const reviewerId = "507f1f77bcf86cd799439013";
    const media = [{ publicId: "review-image", type: "image" }];
    const deleteReview = t.mock.method(
        productReviewModel,
        "findByIdAndDelete",
        async (id) => {
            assert.equal(id, reviewId);
            return { _id: reviewId, user: reviewerId, media };
        }
    );
    t.mock.method(productReviewReplyModel, "find", (filter) => {
        assert.deepEqual(filter, { review: reviewId });
        return {
            select() {
                return this;
            },
            lean: async () => [{ _id: replyId }],
        };
    });
    const deleteVotes = t.mock.method(
        productReviewVoteModel,
        "deleteMany",
        async () => ({ deletedCount: 1 })
    );
    const deleteReplies = t.mock.method(
        productReviewReplyModel,
        "deleteMany",
        async () => ({ deletedCount: 1 })
    );
    const deleteNotifications = t.mock.method(
        customerNotificationModel,
        "deleteMany",
        async () => ({ deletedCount: 1 })
    );
    const deleteMedia = t.mock.method(
        cloudinary.uploader,
        "destroy",
        async () => ({ result: "ok" })
    );
    const response = createResponse();

    await reviewController.deleteAdminProductReview(
        { params: { reviewId } },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(deleteReview.mock.callCount(), 1);
    assert.deepEqual(deleteVotes.mock.calls[0].arguments[0], { review: reviewId });
    assert.deepEqual(deleteReplies.mock.calls[0].arguments[0], { review: reviewId });
    const notificationFilter = deleteNotifications.mock.calls[0].arguments[0];
    assert.equal(
        notificationFilter.$or[0].sourceKey.$regex,
        `^review-vote:${reviewId}:`
    );
    assert.deepEqual(notificationFilter.$or[1].sourceKey.$in, [
        `review-reply:${replyId}`,
    ]);
    assert.deepEqual(deleteMedia.mock.calls[0].arguments, [
        "review-image",
        { resource_type: "image" },
    ]);
});

test("review submission requires a delivered order containing the product", async (t) => {
    const findOne = t.mock.method(orderModel, "findOne", async () => null);
    const createReview = t.mock.method(productReviewModel, "create");
    const response = createResponse();
    const orderId = "507f1f77bcf86cd799439011";
    const productId = "507f1f77bcf86cd799439012";

    await reviewController.createProductReview(
        {
            params: { orderId, productId },
            user: { id: "507f1f77bcf86cd799439013" },
            body: { rating: "5", comment: "Looks great" },
            files: [],
        },
        response
    );

    assert.equal(response.statusCode, 403);
    assert.deepEqual(findOne.mock.calls[0].arguments[0], {
        _id: orderId,
        user: "507f1f77bcf86cd799439013",
        status: "delivered",
        "products.product": productId,
    });
    assert.equal(createReview.mock.callCount(), 0);
});

test("review submission rejects invalid ratings before database access", async (t) => {
    const findOne = t.mock.method(orderModel, "findOne");
    const response = createResponse();

    await reviewController.createProductReview(
        {
            params: {
                orderId: "507f1f77bcf86cd799439011",
                productId: "507f1f77bcf86cd799439012",
            },
            user: { id: "507f1f77bcf86cd799439013" },
            body: { rating: "6", comment: "Looks great" },
            files: [],
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(findOne.mock.callCount(), 0);
});

test("review votes can be toggled off and return updated counts", async (t) => {
    const reviewId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    t.mock.method(productReviewModel, "findById", () => ({
        select: async () => ({ _id: reviewId }),
    }));
    t.mock.method(productReviewVoteModel, "findOne", async () => ({
        _id: "507f1f77bcf86cd799439013",
        value: "like",
    }));
    const deleteVote = t.mock.method(
        productReviewVoteModel,
        "deleteOne",
        async () => ({ deletedCount: 1 })
    );
    t.mock.method(productReviewVoteModel, "countDocuments", async (filter) =>
        filter.value === "like" ? 0 : 1
    );
    const response = createResponse();

    await reviewController.voteOnProductReview(
        { params: { reviewId }, user: { id: userId }, body: { vote: "like" } },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { likes: 0, dislikes: 1, userVote: null });
    assert.deepEqual(deleteVote.mock.calls[0].arguments[0], {
        _id: "507f1f77bcf86cd799439013",
    });
});

test("review likes notify the review author with a direct review link", async (t) => {
    const reviewId = "507f1f77bcf86cd799439011";
    const authorId = "507f1f77bcf86cd799439012";
    const actorId = "507f1f77bcf86cd799439013";
    const productId = "507f1f77bcf86cd799439014";
    t.mock.method(productReviewModel, "findById", () => ({
        select: async () => ({ _id: reviewId, user: authorId, product: productId }),
    }));
    t.mock.method(productReviewVoteModel, "findOne", async () => null);
    t.mock.method(productReviewVoteModel, "create", async () => ({}));
    t.mock.method(productReviewVoteModel, "countDocuments", async (filter) =>
        filter.value === "like" ? 1 : 0
    );
    const saveNotification = t.mock.method(
        customerNotificationService,
        "createNotification",
        async () => ({})
    );
    const response = createResponse();

    await reviewController.voteOnProductReview(
        {
            params: { reviewId },
            user: { id: actorId, username: "Reviewer" },
            body: { vote: "like" },
        },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { likes: 1, dislikes: 0, userVote: "like" });
    assert.deepEqual(saveNotification.mock.calls[0].arguments[0], {
        recipient: authorId,
        sourceKey: `review-vote:${reviewId}:${actorId}:like`,
        type: "review-activity",
        title: "Someone liked your review",
        message: "Reviewer liked your review.",
        relatedId: productId,
        to: `/product/${productId}#review-${reviewId}`,
    });
});

test("review votes reject unsupported values without querying the database", async (t) => {
    const findReview = t.mock.method(productReviewModel, "findById");
    const response = createResponse();

    await reviewController.voteOnProductReview(
        {
            params: { reviewId: "507f1f77bcf86cd799439011" },
            user: { id: "507f1f77bcf86cd799439012" },
            body: { vote: "clap" },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(findReview.mock.callCount(), 0);
});

test("review replies reject empty comments without querying the database", async (t) => {
    const findReview = t.mock.method(productReviewModel, "findById");
    const createReply = t.mock.method(productReviewReplyModel, "create");
    const response = createResponse();

    await reviewController.replyToProductReview(
        {
            params: { reviewId: "507f1f77bcf86cd799439011" },
            user: { id: "507f1f77bcf86cd799439012" },
            body: { comment: "  " },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(findReview.mock.callCount(), 0);
    assert.equal(createReply.mock.callCount(), 0);
});

test("review replies can respond to an existing reply and notify the review author", async (t) => {
    const reviewId = "507f1f77bcf86cd799439011";
    const authorId = "507f1f77bcf86cd799439012";
    const actorId = "507f1f77bcf86cd799439013";
    const productId = "507f1f77bcf86cd799439014";
    const parentReplyId = "507f1f77bcf86cd799439015";
    const newReplyId = "507f1f77bcf86cd799439016";
    t.mock.method(productReviewModel, "findById", () => ({
        select: async () => ({ _id: reviewId, user: authorId, product: productId }),
    }));
    t.mock.method(productReviewReplyModel, "findOne", () => ({
        select: async () => ({ _id: parentReplyId }),
    }));
    const createReply = t.mock.method(
        productReviewReplyModel,
        "create",
        async () => ({ _id: newReplyId })
    );
    t.mock.method(productReviewReplyModel, "findById", () => ({
        populate() {
            return this;
        },
        lean: async () => ({
            _id: newReplyId,
            parentReply: parentReplyId,
            user: { username: "Reviewer" },
            comment: "Thanks for clarifying",
            createdAt: new Date("2026-11-12T06:00:00.000Z"),
        }),
    }));
    const saveNotification = t.mock.method(
        customerNotificationService,
        "createNotification",
        async () => ({})
    );
    const response = createResponse();

    await reviewController.replyToProductReview(
        {
            params: { reviewId },
            user: { id: actorId, username: "Reviewer" },
            body: { comment: "Thanks for clarifying", parentReplyId },
        },
        response
    );

    assert.equal(response.statusCode, 201);
    assert.equal(createReply.mock.calls[0].arguments[0].parentReply, parentReplyId);
    assert.equal(response.body.reply.parentReplyId, parentReplyId);
    assert.equal(response.body.reply.userId, actorId);
    assert.deepEqual(saveNotification.mock.calls[0].arguments[0], {
        recipient: authorId,
        sourceKey: `review-reply:${newReplyId}`,
        type: "review-activity",
        title: "Someone replied to your review",
        message: "Reviewer replied to your review.",
        relatedId: productId,
        to: `/product/${productId}#review-${reviewId}`,
    });
});

test("review updates are restricted to the owner and validate the rating", async (t) => {
    const findOneAndUpdate = t.mock.method(productReviewModel, "findOneAndUpdate");
    const response = createResponse();

    await reviewController.updateProductReview(
        {
            params: { reviewId: "507f1f77bcf86cd799439011" },
            user: { id: "507f1f77bcf86cd799439012" },
            body: { rating: "6", comment: "Updated" },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(findOneAndUpdate.mock.callCount(), 0);
});

test("review deletion is owner-scoped and removes dependent votes and replies", async (t) => {
    const reviewId = "507f1f77bcf86cd799439011";
    const ownerId = "507f1f77bcf86cd799439012";
    const media = [{ publicId: "review-image", type: "image" }];
    t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
    t.mock.method(productReviewModel, "findOneAndDelete", async (filter) => {
        assert.deepEqual(filter, { _id: reviewId, user: ownerId });
        return { _id: reviewId, user: ownerId, media };
    });
    t.mock.method(productReviewReplyModel, "find", () => ({
        select() {
            return this;
        },
        lean: async () => [{ _id: "507f1f77bcf86cd799439013" }],
    }));
    const deleteVotes = t.mock.method(productReviewVoteModel, "deleteMany", async () => ({}));
    const deleteReplies = t.mock.method(productReviewReplyModel, "deleteMany", async () => ({}));
    const deleteNotifications = t.mock.method(
        customerNotificationModel,
        "deleteMany",
        async () => ({})
    );
    const response = createResponse();

    await reviewController.deleteProductReview(
        { params: { reviewId }, user: { id: ownerId } },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(deleteVotes.mock.calls[0].arguments[0], { review: reviewId });
    assert.deepEqual(deleteReplies.mock.calls[0].arguments[0], { review: reviewId });
    assert.equal(deleteNotifications.mock.calls.length, 1);
    assert.deepEqual(
        deleteNotifications.mock.calls[0].arguments[0].$or[1].sourceKey.$in,
        ["review-reply:507f1f77bcf86cd799439013"]
    );
});

test("reply update requires the reply author", async (t) => {
    const replyId = "507f1f77bcf86cd799439013";
    const reviewId = "507f1f77bcf86cd799439011";
    const ownerId = "507f1f77bcf86cd799439012";
    const findOneAndUpdate = t.mock.method(
        productReviewReplyModel,
        "findOneAndUpdate",
        async () => null
    );
    const response = createResponse();

    await reviewController.updateProductReviewReply(
        {
            params: { reviewId, replyId },
            user: { id: ownerId },
            body: { comment: "Edited reply" },
        },
        response
    );

    assert.equal(response.statusCode, 404);
    assert.deepEqual(findOneAndUpdate.mock.calls[0].arguments[0], {
        _id: replyId,
        review: reviewId,
        user: ownerId,
    });
});

test("reply deletion is owner-scoped and removes nested replies", async (t) => {
    const replyId = "507f1f77bcf86cd799439013";
    const childReplyId = "507f1f77bcf86cd799439014";
    const reviewId = "507f1f77bcf86cd799439011";
    const ownerId = "507f1f77bcf86cd799439012";
    const findOneAndDelete = t.mock.method(
        productReviewReplyModel,
        "findOneAndDelete",
        async (filter) => {
            assert.deepEqual(filter, {
                _id: replyId,
                review: reviewId,
                user: ownerId,
            });
            return { _id: replyId };
        }
    );
    const findDescendants = t.mock.method(productReviewReplyModel, "find", (filter) => ({
        select() {
            return this;
        },
        lean: async () => (
            filter.parentReply.$in[0] === replyId
                ? [{ _id: childReplyId }]
                : []
        ),
    }));
    const deleteMany = t.mock.method(productReviewReplyModel, "deleteMany", async () => ({}));
    const deleteNotifications = t.mock.method(
        customerNotificationModel,
        "deleteMany",
        async () => ({})
    );
    const response = createResponse();

    await reviewController.deleteProductReviewReply(
        {
            params: { reviewId, replyId },
            user: { id: ownerId },
        },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(findOneAndDelete.mock.callCount(), 1);
    assert.equal(findDescendants.mock.callCount(), 2);
    assert.deepEqual(deleteMany.mock.calls[0].arguments[0], {
        _id: { $in: [childReplyId] },
    });
    assert.deepEqual(deleteNotifications.mock.calls[0].arguments[0].sourceKey.$in, [
        `review-reply:${replyId}`,
        `review-reply:${childReplyId}`,
    ]);
});
