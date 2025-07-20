const mongoose = require("mongoose");
const slugify = require("slugify");
const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have 20 characters'],
            minlength: [10, 'A tour name must have 10 characters']
        },
        // slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either easy, medium, difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0']
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount:
        {
            type: Number,
            validate: {
                validator: function (val) {
                    return val < this.price
                }
            },
            message: "Discount price ({VALUE}) must be less than actual price"
        },
        Summary: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration;
});

// tourSchema.pre('save', function (next) {
//     this.slug = slugify(this.name, { lower: true });
//     console.log('before');
//     console.log(this);
//     next();
// })

// tourSchema.post('save', function (doc, next) {
//     console.log('after');
//     console.log(doc);
//     next();
// })

tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
})

tourSchema.post(/^find/, function (docs, next) {
    const timeTaken = Date.now() - this.start;
    console.log(timeTaken);
    next();
})

tourSchema.pre('aggregate', function (next) {
    console.log(this.pipeline().unshift({
        $match: { secretTour: { $ne: true } }
    }));
    next();
})

const Tour = new mongoose.model("Tour", tourSchema);
module.exports = Tour;

