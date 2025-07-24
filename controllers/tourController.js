const Tour = require("./../models/tourModel");
const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handleFactory");

exports.aliasTopTours = (req, res, next) => {
    req.url = "/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5";
    next();
}


exports.getAllTours = getAll(Tour);

exports.getSingleTour = getOne(Tour, { path: "reviews" });

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);

exports.createTour = createOne(Tour);

exports.getStats = catchAsyncError(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);
    res.status(201).json({
        status: 'success',
        data: {
            stats
        }
    });
})


exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
    const year = req.params.year * 1;
    const plans = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                },
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numOfTours: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $project: {
                _id: 0,
                month: '$_id',
                tours: 1,
                numOfTours: 1
            }
        },
        {
            $sort: { numOfTours: -1 }
        },
        {
            $limit: 12
        }
    ]);
    res.status(201).json({
        status: 'success',
        data: {
            plans: plans
        }
    });
})