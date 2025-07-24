const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require("hpp");
const qs = require("qs");
const morgan = require("morgan");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorHandler");
const app = express();

app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        ...Object.getOwnPropertyDescriptor(req, 'query'),
        value: req.query,
        writable: true,
    });
    next();
});

//data sanization against nosql query injection-filters all $ and .
app.use(mongoSanitize());

// app.use((req, res, next) => {
//     console.log("Sanitization by mongo-sanitize");    
//     console.log("Sanitized Query:", req.query);
//     next();
// });


//data sanization against xss
app.use(xss());

//headers will be surely set
//set security http headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'));
}

//parsing url when passing $gt $lt according to mongo
app.set("query parser", (str) => qs.parse(str));

//100 req in 1 hr
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "too many requests from this ip , please try again later"
})

//Limit req from same api 
app.use("/api", limiter);

//test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

//body parser , reading data from body into req.body-limit body data to 10kb
app.use(express.json({
    limit: "10kb"
}));


//prevent parameter pollution (we give sort by date and sort by maxval then throws err - we can whitelist some parameters)
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

//serving static files
app.use(express.static("./public"));

//routes
app.use("/api/tours", tourRouter);
app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRouter);

//handling invalid routes
app.all(/.*/, (req, res, next) => {
    next(new AppError(`can't find ${req.originalURL} on this server`, 404));
})

//handling global errors
app.use(globalErrorHandler);

module.exports = app;