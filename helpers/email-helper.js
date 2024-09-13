// const formData = require('form-data');
// const Mailgun = require('mailgun.js');
// const mailgun = new Mailgun(formData);
// const mg = mailgun.client({username: 'api', key: 'd35e619e0c7900a44580d4069e194325-826eddfb-7aa84d50'});
//
//
// const sendEmail = async (to, zip) => {
//     try {
//         const result = await mg.messages.create('sandboxb792fb3c6131472588a185151e7c2acc.mailgun.org', {
//             from: 'admin@karandikartechsolutions.com',
//             to: to,
//             subject: 'Certificate of Calibration',
//             text: 'Please find the attached certificate of calibration',
//             attachment: {filename: 'certificate.zip', data: zip, contentType: 'application/zip'},
//         });
//         console.log(result);
//     } catch (e) {
//         console.log(e);
//     }
// }
//

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