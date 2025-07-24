const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const db_url = (process.env.DATABASE).replace('<db_password>', 'Natours');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
// const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


mongoose.connect(db_url).then((con) => {
    console.log('DB connection successful!');
});
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        // await Review.create(reviews);
        console.log('Tours are added');
    }
    catch (err) {
        console.log(err);
    }
    process.exit();
}
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Tours are deleted');
    }
    catch (err) {
        console.log(err);
    }
    process.exit();
}
if (process.argv[2] == '--import') {
    importData();
}
else {
    deleteData();
}