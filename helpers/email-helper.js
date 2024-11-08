const nodemailer = require('nodemailer');
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
const sendEmail = async (to, fileLocation, serialNumbers) => {

    nodemailer.createTransport(configOptions).sendMail({
        from: 'admin@karandikartechsolutions.com',
        to: to,
        subject: "Certifcate of Calibration",
        text: `Please click the link to download the certificate for the following serial numbers: - ${serialNumbers}`,
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

const sendEmailWithAttachment = async (to, file) => {
    nodemailer.createTransport(configOptions).sendMail({
        from: 'admin@karandikartechsolutions.com',
        to: to,
        subject: "Batch Report",
        text: 'Please find the attached report',
        attachments: [
            {
                filename: 'report.xlsx',
                path: file,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        ]
    }).then((info) => {
        console.log(info);
    }).catch((e) => {
        console.log(e);
    });
};


module.exports = {sendEmail, sendEmailWithAttachment};