const nodemailer = require('nodemailer');

// Simple, reliable SMTP transport using Gmail App Password
// Much more stable than OAuth2 for server-side use
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password (16-char, generated in Google Account settings)
    },
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

transporter.verify((err, success) => {
    if (err) {
        console.error(err);
    } else {
        console.log("SMTP Ready");
    }
});


// Core send function — throws on failure so callers can handle it
const sendEmail = async (to, subject, text, html) => {
    try {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP",
        text: `Your OTP is ${otp}`,
    });

    console.log("Email sent:", info);
} catch (err) {
    console.error("sendMail error:", err);
}
};


async function sendOTPEmail(userEmail, name, otp) {
    const subject = 'Your NexusBank Verification Code';
    const text = `Hello ${name},\n\nYour one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.\n\nNexusBank`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0c4a6e; margin: 0 0 8px 0;">Verify your email</h2>
            <p style="color: #475569; margin: 0 0 24px 0;">Hello ${name}, please use the code below to complete your NexusBank registration.</p>
            <div style="background: #0369a1; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 24px; border-radius: 8px; margin: 0 0 24px 0;">
                ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 16px 0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">NexusBank &mdash; Secure Banking</p>
        </div>
    `;
    await sendEmail(userEmail, subject, text, html);
}


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to NexusBank!';
    const text = `Hello ${name},\n\nThank you for joining NexusBank. Your account is now active.\n\nNexusBank`;
    const html = `<p>Hello ${name},</p><p>Thank you for joining NexusBank. Your account is now active.</p><p>NexusBank</p>`;
    await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful';
    const text = `Hello ${name},\n\nYour transfer of INR ${amount} to account ${toAccount} was successful.\n\nNexusBank`;
    const html = `<p>Hello ${name},</p><p>Your transfer of <strong>INR ${amount}</strong> to account <code>${toAccount}</code> was successful.</p><p>NexusBank</p>`;
    await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nYour transfer of INR ${amount} to account ${toAccount} has failed. Please try again.\n\nNexusBank`;
    const html = `<p>Hello ${name},</p><p>Your transfer of <strong>INR ${amount}</strong> to account <code>${toAccount}</code> has failed. Please try again.</p><p>NexusBank</p>`;
    await sendEmail(userEmail, subject, text, html);
}


module.exports = {
    sendOTPEmail,
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
};