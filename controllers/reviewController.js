const Review = require("./../models/reviewModel");
const ApiFeatures = require("./../utils/ApiFeatures");
// const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handleFactory");


exports.getAllReviews = getAll(Review);

exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createReview = createOne(Review);
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.getReview = getOne(Review);