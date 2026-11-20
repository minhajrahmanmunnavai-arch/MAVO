const mongoose = require("mongoose");
const userModel = require("../models/user.model");

const ADDRESS_FIELDS = {
    fullName: 100,
    email: 254,
    phoneNumber: 50,
    region: 150,
    address: 300,
};

function validateAddress(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const address = {};
    for (const [field, maxLength] of Object.entries(ADDRESS_FIELDS)) {
        const fieldValue = value[field];
        if (
            typeof fieldValue !== "string" ||
            !fieldValue.trim() ||
            fieldValue.trim().length > maxLength
        ) {
            return null;
        }
        address[field] = fieldValue.trim();
    }

    return address;
}

function serializeAddress(address) {
    return {
        id: String(address._id),
        fullName: address.fullName,
        email: address.email,
        phoneNumber: address.phoneNumber,
        region: address.region,
        address: address.address,
        isDefault: Boolean(address.isDefault),
    };
}

async function getMyAddresses(req, res) {
    const user = await userModel.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
        addresses: user.addresses.map(serializeAddress),
    });
}

async function createMyAddress(req, res) {
    const address = validateAddress(req.body);
    if (!address) {
        return res.status(400).json({
            message: "Complete every address field with a valid value.",
        });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    user.addresses.push({
        ...address,
        isDefault: user.addresses.length === 0,
    });
    await user.save();

    return res.status(201).json({
        address: serializeAddress(user.addresses[user.addresses.length - 1]),
    });
}

async function updateMyAddress(req, res) {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
        return res.status(400).json({ message: "A valid address ID is required." });
    }

    const address = validateAddress(req.body);
    if (!address) {
        return res.status(400).json({
            message: "Complete every address field with a valid value.",
        });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    const savedAddress = user.addresses.id(req.params.addressId);
    if (!savedAddress) {
        return res.status(404).json({ message: "Address not found." });
    }

    savedAddress.set(address);
    await user.save();

    return res.status(200).json({
        address: serializeAddress(savedAddress),
    });
}

module.exports = {
    createMyAddress,
    getMyAddresses,
    updateMyAddress,
};
