const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require("./app");
dotenv.config({ path: './config.env' });
const db_url = (process.env.DATABASE).replace('<db_password>', 'Natours');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION - Shutting down');
    process.exit(1);
});

mongoose.connect(db_url).then((con) => {
    console.log('DB connection successful!');
});

const port = process.env.PORT || 3000;
const server = app.listen(3000, () => {
    console.log("running on 3000")
})

process.on("unhandledRejection", err => {
    console.log(err.name, err.message);
    console.log("Unhandled Rejection - SHUTTING DOWN");
    server.close(() => {
        process.exit(1);
    })
})