const AppError = require("./../utils/AppError");

const handleDuplicateFieldsDB = err => {
    const value = Object.keys(err.keyValue).join('');
    const message = `Duplicate field value - ${value} . Please use another value`;
    return new AppError(message, 400);
}

const handleJwtExpireError = err => {
    const message = `Token expired ! Please login again`;
    return new AppError(message, 401);
}

const handleJwtError = err => {
    const message = `Invalid token ! Please login again`;
    return new AppError(message, 401);
}

const handleValidationErrorDB = err => {
    const errorMessages = Object.keys(err.errors).map((key) => {
        const error = err.errors[key];
        return `${error.message}`;
    });
    const message = `Invalid input Data : ${errorMessages.join('. ')}`;
    return new AppError(message, 400);
}

const sendProdError = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    else {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "something went wrong"
        });
    }
}

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (process.env.NODE_ENV === "development") {
        sendDevError(err, res);
    }
    else if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.stack = err.stack;
        console.log(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJwtError(error);
        if (error.name === 'TokenExpiredError')
            error = handleJwtExpireError(error);
        sendProdError(error, res);

    }

}