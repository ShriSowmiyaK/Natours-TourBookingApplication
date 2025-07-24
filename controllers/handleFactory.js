const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const ApiFeatures = require("./../utils/ApiFeatures");

exports.deleteOne = Model => catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: null
    });
})

exports.updateOne = Model => catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
})

exports.createOne = Model => catchAsyncError(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            data: newDoc
        }
    })
})

exports.getOne = (Model, popOptions) => catchAsyncError(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
        return next(new AppError("There is no doc with such an id", 404));
    }
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
})

exports.getAll = Model => catchAsyncError(async (req, res, next) => {
    //to allow nested get reviews on tour
    let filter = {};
    if (req.params.tourId) {
        filter = { tour: req.params.tourId };
    }
    //Getting features from ApiFeatures
    const features = new ApiFeatures(Model.find(filter), req.query).filter().sorting().fieldLimiting().pagination();
    //Execute query
    const docs = await features.query;
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            docs
        }
    });

})