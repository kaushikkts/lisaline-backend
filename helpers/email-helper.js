const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: ''});


const sendEmail = async (to, zip) => {
    try {
        const result = await mg.messages.create('sandboxb792fb3c6131472588a185151e7c2acc.mailgun.org', {
            from: 'admin@karandikartechsolutions.com',
            to: to,
            subject: 'Certificate of Calibration',
            text: 'Please find the attached certificate of calibration',
            attachment: {filename: 'certificate.zip', data: zip, contentType: 'application/zip'},
        });
        console.log(result);
    } catch (e) {
        console.log(e);
    }
}

module.exports = sendEmail;