
const nodemailer = require("nodemailer");

/**
 * @name sendEmail
 * @description Send an email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain-text email body
 * @param {string} [html] - Optional HTML email body
 * @access Public
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            ...(html && { html })
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent:", info.messageId);

        return info;

    } catch (error) {
        console.error("Email Error Code:", error.code);
        console.error("Email Error Message:", error.message);
        console.error("Email Response:", error.response);

        throw new Error("Failed to send email");
    }
};

module.exports = { sendEmail };
