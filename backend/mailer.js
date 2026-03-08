const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'mylene.spencer@ethereal.email',
        pass: process.env.SMTP_PASS || '6WgC97b9F5qD1nNnmV'
    }
});

const sendAlertEmail = async (subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"TWPMS Alerts" <alerts@twpms.local>',
            to: 'admin@twpms.local',
            subject: subject,
            text: text,
        });
        console.log('Alert email sent: %s', info.messageId);
    } catch (err) {
        console.error('Error sending alert email:', err);
    }
};

module.exports = { sendAlertEmail };
