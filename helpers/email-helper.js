const nodemailer = require('nodemailer');
const sendEmail = async (to, zip) => {
    let configOptions = {
        host: "smtp-relay.brevo.com",
        port: 587,
        tls: {
            rejectUnauthorized: true,
            minVersion: "TLSv1.2"
        },
        auth: {
            user: "",
            pass: ""
        }
    }
    nodemailer.createTransport(configOptions).sendMail({
        from: 'admin@karandikartechsolutions.com',
        to: to,
        subject: "Certifcate of Calibration",
        attachments: [
            {
                filename: 'certificate.zip',
                content: zip,
                contentType: 'application/zip'
            }
        ]
    }).then((info) => {
        console.log(info);
    }).catch((e) => {
        console.log(e);
    });
}
module.exports = sendEmail;