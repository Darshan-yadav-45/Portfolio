const db = require('../config/database');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const submitMessage = async (req, res) => {
    // 1. Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorArray = errors.array();
        // Check specific errors based on user requirements
        const hasEmailError = errorArray.some(err => err.path === 'email');
        if (hasEmailError) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
        
        // If other fields are missing or empty
        const hasEmptyError = errorArray.some(err => err.msg === 'Required' || err.msg === 'Empty');
        if (hasEmptyError) {
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        return res.status(400).json({ error: 'Invalid input. Please check your fields and try again.' });
    }

    const { name, email, subject, message } = req.body;

    // 2. Save to database
    try {
        await db.query(
            `INSERT INTO contact_messages (name, email, subject, message, status) VALUES ($1, $2, $3, $4, 'unread')`,
            [name, email, subject || 'No Subject', message]
        );
    } catch (dbErr) {
        console.error('Database Error:', dbErr);
        // "Server error:"
        return res.status(500).json({ error: 'Unable to send your message right now. Please try again later.' });
    }

    // 3. Send Email
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // Need environment variables for this
                pass: process.env.SMTP_PASS
            }
        });

        // Only attempt to send if SMTP_USER is configured, otherwise just log and succeed (for local testing without crashing)
        if (process.env.SMTP_USER) {
            // Send email to Admin
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: process.env.CONTACT_EMAIL_TO || 'darshan.km.091@gmail.com',
                replyTo: email,
                subject: `New Portfolio Message: ${subject || 'No Subject'}`,
                text: `You have received a new message from your portfolio contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
                html: `<p>You have received a new message from your portfolio contact form.</p><p><strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br>${message}</p>`
            });

            // Send formal auto-reply to User
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: `Thank you for contacting DARSHAN K M`,
                text: `Dear ${name},\n\nThank you for reaching out! This is an automated response to confirm that I have successfully received your message regarding "${subject || 'your inquiry'}".\n\nI will review your message and get back to you as soon as possible.\n\nBest regards,\nDARSHAN K M`,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Thank You for Reaching Out!</h2>
                    <p>Dear ${name},</p>
                    <p>This is an automated response to confirm that I have successfully received your message regarding "<strong>${subject || 'your inquiry'}</strong>".</p>
                    <p>I will review your message and get back to you as soon as possible.</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>DARSHAN K M</strong><br><a href="mailto:darshan.km.091@gmail.com">darshan.km.091@gmail.com</a></p>
                </div>`
            });
        } else {
            console.warn('SMTP_USER not set. Emails were NOT sent, but message was saved to database.');
        }

        // Final success response
        return res.status(200).json({ success: true });
    } catch (emailErr) {
        console.error('Email Service Error:', emailErr);
        // "Email service failure:"
        return res.status(500).json({ error: 'Message could not be sent. Please try again later.' });
    }
};

const getMessages = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateMessageStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteMessage = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};

module.exports = {
    submitMessage,
    getMessages,
    updateMessageStatus,
    deleteMessage
};
