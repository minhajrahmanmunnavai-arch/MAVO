const test = require("node:test");
const assert = require("node:assert/strict");
const addressController = require("../src/controller/addressController");
const userModel = require("../src/models/user.model");
const authMiddleware = require("../src/middlewares/auth.middleware");
const addressRouter = require("../src/routes/address.routes");

const userId = "507f1f77bcf86cd799439011";
const addressId = "507f1f77bcf86cd799439012";
const addressInput = {
    fullName: "Customer",
    email: "customer@example.com",
    phoneNumber: "01700000000",
    region: "Dhaka",
    address: "1 Main Street",
};

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

function createUser(addresses = []) {
    return new userModel({
        _id: userId,
        username: "Customer",
        email: "customer@example.com",
        password: "hashed-password",
        addresses,
    });
}

test("address routes require an authenticated user", () => {
    for (const method of ["get", "post", "patch"]) {
        const route = addressRouter.stack.find(
            (layer) => layer.route?.methods[method]
        );
        assert.ok(route);
        assert.equal(route.route.stack[0].handle, authMiddleware.authUser);
    }
});

test("address listing returns only addresses belonging to the authenticated user", async (t) => {
    const user = createUser([{ ...addressInput, _id: addressId, isDefault: true }]);
    t.mock.method(userModel, "findById", async (id) => {
        assert.equal(id, userId);
        return user;
    });
    const response = createResponse();

    await addressController.getMyAddresses(
        { user: { id: userId } },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.addresses, [{
        id: addressId,
        ...addressInput,
        isDefault: true,
    }]);
});

test("creating an address validates input and marks the first address as default", async (t) => {
    const user = createUser();
    t.mock.method(userModel, "findById", async (id) => {
        assert.equal(id, userId);
        return user;
    });
    t.mock.method(user, "save", async () => user);
    const response = createResponse();

    await addressController.createMyAddress(
        {
            user: { id: userId },
            body: { ...addressInput, role: "admin" },
        },
        response
    );

    assert.equal(response.statusCode, 201);
    assert.equal(user.addresses.length, 1);
    assert.equal(user.addresses[0].isDefault, true);
    assert.deepEqual(response.body.address, {
        id: String(user.addresses[0]._id),
        ...addressInput,
        isDefault: true,
    });
});

test("invalid address submissions are rejected without database access", async (t) => {
    const findById = t.mock.method(userModel, "findById", async () => {
        throw new Error("User lookup should not occur.");
    });
    const response = createResponse();

    await addressController.createMyAddress(
        {
            user: { id: userId },
            body: { ...addressInput, region: " " },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(findById.mock.callCount(), 0);
});

test("editing an address only changes a subdocument owned by the authenticated user", async (t) => {
    const user = createUser([{ ...addressInput, _id: addressId, isDefault: true }]);
    t.mock.method(userModel, "findById", async (id) => {
        assert.equal(id, userId);
        return user;
    });
    t.mock.method(user, "save", async () => user);
    const response = createResponse();
    const updatedAddress = { ...addressInput, address: "2 Main Street" };

    await addressController.updateMyAddress(
        {
            user: { id: userId },
            params: { addressId },
            body: updatedAddress,
        },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(user.addresses[0].address, "2 Main Street");
    assert.deepEqual(response.body.address, {
        id: addressId,
        ...updatedAddress,
        isDefault: true,
    });
});

test("address IDs belonging to another user cannot be edited", async (t) => {
    const user = createUser();
    t.mock.method(userModel, "findById", async () => user);
    const response = createResponse();

    await addressController.updateMyAddress(
        {
            user: { id: userId },
            params: { addressId },
            body: addressInput,
        },
        response
    );

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { message: "Address not found." });
});
