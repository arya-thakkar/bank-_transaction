const { Resend } = require('resend');

// Resend uses HTTPS (port 443), so it isn't affected by Render's
// blocking of outbound SMTP ports (25, 465, 587).
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address:
// - 'onboarding@resend.dev' only works for sending to YOUR OWN verified
//   Resend account email (fine for testing).
// - Once you verify a domain in Resend, change this to something like
//   'NexusBank <otp@yourdomain.com>' to send to any real user.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'NexusBank <onboarding@resend.dev>';

// Core send function
const sendEmail = async (to, subject, text, html) => {
    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject,
        text,
        html,
    });

    if (error) {
        console.error('Email send failed:', error);
        throw new Error(error.message || 'Failed to send email');
    }

    console.log('Email sent to %s: %s', to, data.id);
    return data;
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