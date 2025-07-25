const Tour = require("./../models/tourModel");
const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handleFactory");

exports.aliasTopTours = (req, res, next) => {
    // req.url = "/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5";
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'ratingsAverage,price,name,difficulty,summary';
    req.query.limit = '5';
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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsyncError(
    async (req, res, next) => {
        const { distance, latlng, unit } = req.params;
        const [lat, lng] = latlng.split(",");
        const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
        if (!lat || !lng) {
            next(
                new AppError(
                    'Please provide latitute and longitude in the format lat,lng.',
                    400
                )
            );
        }
        const tours = await Tour.find({
            startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
        });

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                data: tours
            }
        });
    })

exports.getDistances = catchAsyncError(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitute and longitude in the format lat,lng.',
                400
            )
        );
    }
    //geoNear should always be first in pipeline,
    //also requires 1 of fields that contain geospatial index
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
})