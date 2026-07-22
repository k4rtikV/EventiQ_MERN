const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;

const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const escapeRegex = (text) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (email) =>
    email.trim().toLowerCase();

const isValidEmail = (email) =>
    email.length <= 254 &&
    EMAIL_PATTERN.test(email);

const findUserByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);

    return await User.findOne({
        email: new RegExp(
            `^${escapeRegex(normalizedEmail)}$`,
            'i'
        )
    });
};

const findOTPByEmail = async (
    email,
    action,
    otp
) => {
    const normalizedEmail =
        email.trim().toLowerCase();

    return await OTP.findOne({
        email: new RegExp(
            `^${escapeRegex(normalizedEmail)}$`,
            'i'
        ),
        otp,
        action
    });
};

exports.register = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message:
                    'Name, email, and password are required'
            });
        }

        if (typeof email !== 'string') {
            return res.status(400).json({
                message:
                    'Please enter a valid email address'
            });
        }

        if (typeof password !== 'string') {
            return res.status(400).json({
                message:
                    'Password must be a valid text value'
            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message:
                    'Please enter a valid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message:
                    'Password must be at least 8 characters long'
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                message:
                    'Password must not exceed 128 characters'
            });
        }

        if (!PASSWORD_PATTERN.test(password)) {
            return res.status(400).json({
                message:
                    'Password must include an uppercase letter, a lowercase letter, a number, and a special character'
            });
        }

        let user =
            await findUserByEmail(normalizedEmail);

        if (user) {
            return res.status(400).json({
                message:
                    'An account with this email already exists'
            });
        }

        const salt =
            await bcrypt.genSalt(10);

        const hashedPassword =
            await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user',
            isVerified: false
        });

        const otp = generateOTP();

        await OTP.create({
            email: normalizedEmail,
            otp,
            action: 'account_verification'
        });

        await sendOTPEmail(
            normalizedEmail,
            otp,
            'account_verification'
        );

        res.status(201).json({
            message:
                'OTP sent to email. Please verify.',
            email: user.email
        });
    } catch (error) {
        if (
            error.code === 11000 &&
            error.keyPattern?.email
        ) {
            return res.status(400).json({
                message:
                    'An account with this email already exists'
            });
        }

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message:
                    'Email and password are required'
            });
        }

        if (
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message:
                    'Invalid email or password format'
            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message:
                    'Please enter a valid email address'
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                message:
                    'Password must not exceed 128 characters'
            });
        }

        const user =
            await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(400).json({
                message:
                    'Invalid email or password'
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {
            return res.status(400).json({
                message:
                    'Invalid email or password'
            });
        }

        if (
            !user.isVerified &&
            user.role !== 'admin'
        ) {
            const otp = generateOTP();

            await OTP.findOneAndDelete({
                email: user.email,
                action: 'account_verification'
            });

            await OTP.create({
                email: user.email,
                otp,
                action: 'account_verification'
            });

            await sendOTPEmail(
                user.email,
                otp,
                'account_verification'
            );

            return res.status(403).json({
                message:
                    'Account not verified',
                needsVerification: true,
                email: user.email
            });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(
                user.id,
                user.role
            )
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message:
                    'Email and OTP are required'
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const validOTP =
            await findOTPByEmail(
                normalizedEmail,
                'account_verification',
                otp
            );

        if (!validOTP) {
            return res.status(400).json({
                message:
                    'Invalid or expired OTP'
            });
        }

        const user =
            await User.findOneAndUpdate(
                {
                    email: normalizedEmail
                },
                {
                    isVerified: true
                },
                {
                    new: true
                }
            );

        await OTP.deleteOne({
            _id: validOTP._id
        });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(
                user.id,
                user.role
            )
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server Error'
        });
    }
};