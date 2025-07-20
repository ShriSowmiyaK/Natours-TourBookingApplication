const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const db_url = (process.env.DATABASE).replace('<db_password>', 'Natours');
const Tour = require('./../../models/tourModel');
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

mongoose.connect(db_url).then((con) => {
    console.log('DB connection successful!');
});
const importData = async () => {
    try {
        await Tour.create(tours);
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