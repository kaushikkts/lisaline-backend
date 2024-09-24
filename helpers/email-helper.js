const nodemailer = require('nodemailer');
const sendEmail = async (to, fileLocation) => {
    let configOptions = {
        host: "smtp-relay.brevo.com",
        port: 587,
        tls: {
            rejectUnauthorized: true,
            minVersion: "TLSv1.2"
        },
        auth: {
            user: "7beb71001@smtp-brevo.com",
            pass: "dRsBpKnyghtJHWX9"
        }
    }
    nodemailer.createTransport(configOptions).sendMail({
        from: 'admin@karandikartechsolutions.com',
        to: to,
        subject: "Certifcate of Calibration",
        text: "Please click the link to download the certificate",
        html: `<a href="${fileLocation}">Download Certificates</a>`
        // attachments: [
        //     {
        //         filename: 'certificate.zip',
        //         content: zip,
        //         contentType: 'application/zip'
        //     }
        // ]
    }).then((info) => {
        console.log(info);
    }).catch((e) => {
        console.log(e);
    });
}
module.exports = sendEmail;