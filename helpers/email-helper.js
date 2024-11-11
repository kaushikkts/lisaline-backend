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
        subject: "Certificate of Calibration",
        text: `Please click the link to download the certificate for the following serial numbers: - ${serialNumbers}`,
        html: `
            <p>Please click the link to download the certificate for the following serial numbers: - ${serialNumbers}</p>
            <a href="${fileLocation}">Download Certificates</a>`
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
        html: `
            <p>Please click the link to download the report</p>
            <a href="${file}">Download Report</a>`
        // attachments: [
        //     {
        //         filename: 'report.xlsx',
        //         path: file,
        //         contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        //     }
        // ]
    }).then((info) => {
        console.log(info);
    }).catch((e) => {
        console.log(e);
    });
};


module.exports = {sendEmail, sendEmailWithAttachment};