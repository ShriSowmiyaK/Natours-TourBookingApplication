const Tour = require("./../models/tourModel");
const ApiFeatures = require("./../utils/ApiFeatures");
const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");


exports.aliasTopTours = (req, res, next) => {
    req.url = "/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5";
    next();
}


exports.getAllTours = catchAsyncError(async (req, res, next) => {
    //Getting features from ApiFeatures
    const features = new ApiFeatures(Tour.find(), req.query).filter().sorting().fieldLimiting().pagination();
    //Execute query
    const tours = await features.query;
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });

})

exports.createTour = catchAsyncError(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    })
})


exports.getSingleTour = catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: {
            tour
        }
    });
})


exports.updateTour = catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!tour) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: {
            tour
        }
    });
})


exports.deleteTour = catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
        return next(new AppError("There is no tour with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: null
    });
})


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