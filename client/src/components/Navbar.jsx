import React, {
    useContext
} from 'react';

import {
    Link,
    NavLink,
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

    const navLinkClass = ({
        isActive
    }) => {
        return [
            'relative px-3 py-2 rounded-xl font-medium',
            'border transition-all duration-200 ease-out',
            'hover:-translate-y-0.5',
            'focus:outline-none focus-visible:ring-2',
            'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
            'focus-visible:ring-offset-gray-900',
            isActive
                ? [
                    'bg-white/[0.85] text-slate-900',
                    'border-white/40 backdrop-blur-2xl',
                    'shadow-lg shadow-black/20',
                    'font-semibold'
                ].join(' ')
                : [
                    'border-transparent text-gray-200',
                    'hover:bg-white/10 hover:text-white',
                    'hover:border-white/10 hover:backdrop-blur-md',
                    'hover:shadow-md hover:shadow-black/10'
                ].join(' ')
        ].join(' ');
    };

    const utilityButtonClass = [
        'w-10 h-10 rounded-xl',
        'border border-white/10',
        'bg-white/5 hover:bg-white/10',
        'hover:border-white/20',
        'text-white inline-flex items-center justify-center',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/15',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-gray-900'
    ].join(' ');

    return (
        <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
                    <Link
                        to="/"
                        className="group text-white text-2xl font-bold flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition-all duration-200 hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5 hover:backdrop-blur-md hover:shadow-md hover:shadow-black/10"
                    >
                        <FaTicketAlt className="transition-all duration-200 ease-out group-hover:rotate-6 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_6px_rgba(147,197,253,0.65)]" />
                        <span className="transition-colors duration-200 group-hover:text-white">
                            EventiQ
                        </span>
                    </Link>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <NavLink
                            to="/"
                            end
                            className={navLinkClass}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/events"
                            className={navLinkClass}
                        >
                            Events
                        </NavLink>

                        {user ? (
                            <>
                                <NavLink
                                    to={
                                        user.role ===
                                        'admin'
                                            ? '/admin'
                                            : '/dashboard'
                                    }
                                    className={navLinkClass}
                                >
                                    Profile
                                </NavLink>

                                <div className="rounded-xl">
                                    <NotificationBell />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="bg-gray-700/70 hover:bg-red-500/20 text-white hover:text-red-300 px-4 py-2 rounded-xl border border-gray-600 hover:border-red-400/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-red-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className={navLinkClass}
                                >
                                    Login
                                </NavLink>

                                <NavLink
                                    to="/register"
                                    className={({
                                        isActive
                                    }) =>
                                        [
                                            'px-4 py-2 rounded-xl font-semibold border',
                                            'transition-all duration-200 ease-out',
                                            'hover:-translate-y-0.5 hover:shadow-md',
                                            'focus:outline-none focus-visible:ring-2',
                                            'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                                            'focus-visible:ring-offset-gray-900',
                                            isActive
                                                ? [
                                                    'bg-white/[0.85] text-slate-900',
                                                    'border-white/40 backdrop-blur-2xl',
                                                    'shadow-lg shadow-black/20'
                                                ].join(' ')
                                                : [
                                                    'bg-white text-gray-900 border-white',
                                                    'hover:bg-gray-100'
                                                ].join(' ')
                                        ].join(' ')
                                    }
                                >
                                    Sign Up
                                </NavLink>
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
                            className={utilityButtonClass}
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