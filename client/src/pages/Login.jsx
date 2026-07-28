import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const validateLoginFields = () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) return 'Email address is required.';
        if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
            return 'Please enter a valid email address.';
        }
        if (!password) return 'Password is required.';
        if (password.length > 128) return 'Password must not exceed 128 characters.';

        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!showOTP) {
            const validationError = validateLoginFields();
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        setLoading(true);

        try {
            if (!showOTP) {
                const normalizedEmail = email.trim().toLowerCase();
                const data = await login(normalizedEmail, password);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new OTP has been sent to your email.');
            } else {
                setError(err.message || err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 dark:text-gray-100">Welcome Back</h2>
                <p className="text-gray-500 dark:text-gray-400">Sign in to your EventiQ account</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {!showOTP ? (
                    <>
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                autoComplete="email"
                                maxLength="254"
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition shadow-sm dark:border-gray-600"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError('');
                                }}
                                onBlur={() => setEmail((currentEmail) => currentEmail.trim().toLowerCase())}
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    maxLength="128"
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition shadow-sm dark:border-gray-600"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className="absolute inset-y-1.5 right-1.5 z-10 flex w-10 items-center justify-center rounded-md bg-white/90 text-gray-600 hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-white"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <label htmlFor="login-otp" className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                            Verification Code (OTP)
                        </label>
                        <input
                            id="login-otp"
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg dark:border-gray-600"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 py-3 font-bold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:via-violet-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:border dark:border-white/15 dark:shadow-black/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Log In' : 'Sign In')}
                </button>
            </form>

            <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-bold text-blue-700 hover:text-blue-800 hover:underline dark:text-cyan-300 dark:hover:text-cyan-200">
                    Sign up
                </Link>
            </p>
        </div>
    );
};

export default Login;