const nodemailer = require("nodemailer");
exports.sendEmail = (options) => {
    //create a transporter - service that sends mail
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    //define the options
    const mailoptions = {
        from: `sowmi <tempdummy18@gmail.com>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    //actually send the email with nodemail
    transporter.sendMail(mailoptions,
        function (err, data) {
            if (err) {
                console.log('Error Occurs in mail');
            } else {
                console.log('Email sent successfully');
            }
        });
}
