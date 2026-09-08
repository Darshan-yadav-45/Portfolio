const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate Limiting / spam protection
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 contact requests per windowMs
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation and sanitization middleware
const contactValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Required')
        .isLength({ max: 100 }).withMessage('Name too long')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Required')
        .isEmail().withMessage('Invalid email')
        .normalizeEmail(),
    body('subject')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 200 }).withMessage('Subject too long')
        .escape(),
    body('message')
        .trim()
        .notEmpty().withMessage('Required')
        .isLength({ max: 5000 }).withMessage('Message too long')
        .escape()
];

router.post('/', contactLimiter, contactValidation, contactController.submitMessage);

module.exports = router;
