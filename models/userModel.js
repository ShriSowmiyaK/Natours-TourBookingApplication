const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"]
    },
    email: {
        type: String,
        required: [true, "Please provide us your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide valid email"]
    },
    photo: {
        type: String
    },
    role: {
        type: "String",
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user"
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        //works only on create,save and not on updates as no this key word pointed(Also for pre,post hooks)
        validate: {
            validator: function (el) {
                return el === this.password;
            }
        }
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    if (this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

})

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changesPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //After login user changed password
        return JWTTimestamp < changedTimeStamp;
    }
    //not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    console.log(resetToken, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken
}

const User = new mongoose.model("User", userSchema);
module.exports = User;