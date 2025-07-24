const User = require("./../models/userModel");
const ApiFeatures = require("./../utils/ApiFeatures");
const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handleFactory");

const filterObj = (existingFields, ...allowedFields) => {
    const fields = {};
    Object.keys(existingFields).forEach(el => {
        if (allowedFields.includes(el)) {
            fields[el] = existingFields[el]
        }
    })
    return fields;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsyncError(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updatePassword .', 400));
    }
    //filter unwanted
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Use signup!'
    });
};

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);