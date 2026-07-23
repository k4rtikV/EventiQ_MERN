import React, {
    useContext
} from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    FaMoon,
    FaSun,
    FaTicketAlt
} from 'react-icons/fa';

import {
    AuthContext
} from '../context/AuthContext';

import {
    useTheme
} from '../context/ThemeContext';

import NotificationBell from './NotificationBell';

const Navbar = () => {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const {
        isDark,
        toggleTheme
    } = useTheme();

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
                    <Link
                        to="/"
                        className="text-white text-2xl font-bold flex items-center gap-2"
                    >
                        <FaTicketAlt />
                        EventiQ
                    </Link>

                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                        <Link
                            to="/"
                            className="text-gray-200 hover:text-white transition"
                        >
                            Home
                        </Link>

                        <Link
                            to="/events"
                            className="text-gray-200 hover:text-white transition"
                        >
                            Events
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={
                                        user.role ===
                                        'admin'
                                            ? '/admin'
                                            : '/dashboard'
                                    }
                                    className="text-gray-200 hover:text-white transition"
                                >
                                    Profile
                                </Link>

                                <NotificationBell />

                                <button
                                    type="button"
                                    onClick={
                                        handleLogout
                                    }
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-200 hover:text-white transition"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold transition"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label={
                                isDark
                                    ? 'Switch to light mode'
                                    : 'Switch to dark mode'
                            }
                            title={
                                isDark
                                    ? 'Switch to light mode'
                                    : 'Switch to dark mode'
                            }
                            className="w-10 h-10 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 text-white inline-flex items-center justify-center transition"
                        >
                            {isDark ? (
                                <FaSun />
                            ) : (
                                <FaMoon />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;