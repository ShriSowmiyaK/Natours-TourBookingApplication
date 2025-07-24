const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsyncError = require("./../utils/catchAsyncError");
const AppError = require("./../utils/AppError");
const { sendEmail } = require("./../utils/email");


const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
}


const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        //encrypted connection in production => secure: true,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    //remove password from output
    user.password = undefined;
    res.cookie('jsonWebToken', token, cookieOptions);
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}


exports.signup = catchAsyncError(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });
    createSendToken(newUser, 201, res);
});


exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    //chk email,password
    if (!email || !password) {
        return next(new AppError("Please provide email and password", 401));
    }
    const crtUser = await User.findOne({ email }).select('+password');

    if (!crtUser || !await crtUser.correctPassword(password, crtUser.password)) {
        return next(new AppError("Incorrect email or password", 401));
    }
    //After verifying give new token
    createSendToken(crtUser, 200, res);
});


//Protect when going to routes like getting all tours 00
exports.protect = catchAsyncError(async (req, res, next) => {
    //get token , chk if its there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new AppError("You are not logged in !! Login to get access", 401));
    }
    //verify token
    const verify = promisify(jwt.verify);
    const decode = await verify(token, process.env.JWT_SECRET);
    // console.log(decode);
    //chk if user still exists (What if user is deleted (hacker knows password , user changes password but old token will exist))
    const currentUser = await User.findById(decode.id);
    if (!currentUser) {
        return next(new AppError("The user no longer exist", 401));
    }
    //chk if user changed password after jwt issued
    if (currentUser.changesPasswordAfter(decode.iat)) {
        return next(new AppError("User recently changed password ! Please log in again", 401));
    }
    //Attaching user to next middleware
    req.user = currentUser;
    next();
});


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
}


exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    //get user on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError("There is no user with such email address", 404));
    }
    //generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //send it to user email
    const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to:${resetURL} .If you didn't forget password ignore this mail`;
    try {
        await sendEmail({
            email: user.email,
            subject: "Your token is valid only for 10 mins",
            message
        });
        res.status(200).json({
            status: "success",
            message: "Token is sent to email"
        })
    }
    catch (err) {
        console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("There was an error in the email. Try again later", 500))
    }

})


exports.resetPassword = catchAsyncError(async (req, res, next) => {
    //get user based on token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    //send password if token not expired and there is user,set the user
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 404));
    }
    //update to changedPassword property for user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //log the user in send jwt to client
    createSendToken(user, 200, res);
})

exports.updatePassword = catchAsyncError(async (req, res, next) => {
    //get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //chk if posted password is right
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }
    //if crt update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //log in user,send jwt
    createSendToken(user, 200, res);
})