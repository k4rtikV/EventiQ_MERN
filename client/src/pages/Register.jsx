import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;

const COMMON_EMAIL_PROVIDERS = {
    gmail: {
        aliases: ['gmail', 'gamil', 'gmial', 'gmal'],
        validDomains: ['gmail.com'],
        suggestedDomain: 'gmail.com'
    },
    outlook: {
        aliases: ['outlook', 'outlok', 'outllok'],
        validDomains: ['outlook.com'],
        suggestedDomain: 'outlook.com'
    },
    hotmail: {
        aliases: ['hotmail', 'hotnail', 'hotmai'],
        validDomains: ['hotmail.com'],
        suggestedDomain: 'hotmail.com'
    },
    yahoo: {
        aliases: ['yahoo', 'yaho'],
        validDomains: ['yahoo.com', 'yahoo.co.in', 'yahoo.in'],
        suggestedDomain: 'yahoo.com'
    },
    icloud: {
        aliases: ['icloud', 'iclod'],
        validDomains: ['icloud.com'],
        suggestedDomain: 'icloud.com'
    }
};

const getEmailSuggestion = (emailValue) => {
    const normalizedEmail = emailValue.trim().toLowerCase();
    const atIndex = normalizedEmail.lastIndexOf('@');

    if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
        return '';
    }

    const localPart = normalizedEmail.slice(0, atIndex);
    const domain = normalizedEmail.slice(atIndex + 1);
    const providerPart = domain.split('.')[0];

    const providerRule = Object.values(COMMON_EMAIL_PROVIDERS).find(
        ({ aliases }) => aliases.includes(providerPart)
    );

    if (!providerRule || providerRule.validDomains.includes(domain)) {
        return '';
    }

    return `${localPart}@${providerRule.suggestedDomain}`;
};

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();
    const emailSuggestion = getEmailSuggestion(email);

    const applyEmailSuggestion = () => {
        if (!emailSuggestion) return;

        setEmail(emailSuggestion);
        setError('');
    };

    const validateRegistrationFields = () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) return 'Email address is required.';
        if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
            return 'Please enter a valid email address.';
        }

        const suggestedEmail = getEmailSuggestion(normalizedEmail);

        if (suggestedEmail) {
            return `Please review the email address entered. Did you mean ${suggestedEmail}?`;
        }

        if (!password) return 'Password is required.';
        if (password.length < 8) return 'Password must be at least 8 characters long.';
        if (password.length > 128) return 'Password must not exceed 128 characters.';
        if (!PASSWORD_PATTERN.test(password)) {
            return 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.';
        }
        if (!confirmPassword) return 'Please confirm your password.';
        if (password !== confirmPassword) return 'Passwords do not match.';

        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!showOTP) {
            const validationError = validateRegistrationFields();

            if (validationError) {
                setError(validationError);

                if (getEmailSuggestion(email)) {
                    document.getElementById('register-email')?.focus();
                }

                return;
            }
        }

        setLoading(true);

        try {
            if (!showOTP) {
                const normalizedEmail = email.trim().toLowerCase();
                await register(name, normalizedEmail, password);
                setEmail(normalizedEmail);
                setShowOTP(true);
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create an Account</h2>
                <p className="text-gray-500">Join EventiQ today</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {!showOTP ? (
                    <>
                        <div>
                            <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="register-name"
                                type="text"
                                required
                                autoComplete="name"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="register-email"
                                type="email"
                                required
                                autoComplete="email"
                                maxLength="254"
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError('');
                                }}
                                onBlur={() => setEmail((currentEmail) => currentEmail.trim().toLowerCase())}
                            />

                            {emailSuggestion && (
                                <p className="mt-2 text-sm text-amber-700">
                                    Did you mean{' '}
                                    <button
                                        type="button"
                                        onClick={applyEmailSuggestion}
                                        className="font-semibold underline underline-offset-2 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-sm"
                                    >
                                        {emailSuggestion}
                                    </button>
                                    ?
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    minLength="8"
                                    maxLength="128"
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Use 8–128 characters with uppercase, lowercase, number, and special character.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="register-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    maxLength="128"
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    aria-pressed={showConfirmPassword}
                                >
                                    {showConfirmPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-sm text-green-700 bg-green-50 p-3 mb-4 rounded border border-green-200">
                            An OTP has been sent to your email. Please verify your account.
                        </p>
                        <label htmlFor="register-otp" className="block text-sm font-semibold text-gray-700 mb-2">
                            Verification Code (OTP)
                        </label>
                        <input
                            id="register-otp"
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black focus:ring-4 focus:ring-gray-200 transition shadow-md mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify & Complete' : 'Sign Up')}
                </button>
            </form>

            {!showOTP && (
                <p className="text-center mt-6 text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-gray-900 font-bold hover:underline">
                        Sign in
                    </Link>
                </p>
            )}
        </div>
    );
};

export default Register;