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
    FaSignOutAlt,
    FaSun,
    FaTicketAlt,
    FaUserShield
} from 'react-icons/fa';

import AuthContext from '../context/AuthContextValue';

import {
    useTheme
} from '../context/ThemeContext';

import NotificationBell from './NotificationBell';
import {
    getAvatarSrc
} from '../data/avatarOptions';

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
            'relative px-1 py-2 text-sm sm:text-base font-medium',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2',
            'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
            'focus-visible:ring-offset-gray-900 rounded-md',
            'after:absolute after:left-0 after:right-0 after:-bottom-0.5',
            'after:h-0.5 after:rounded-full',
            'after:transition-all after:duration-200',
            isActive
                ? [
                    'text-white',
                    'after:bg-gradient-to-r',
                    'after:from-blue-400 after:via-purple-400 after:to-cyan-400',
                    'after:scale-x-100'
                ].join(' ')
                : [
                    'text-gray-300 hover:text-white',
                    'after:bg-white/40 after:scale-x-0',
                    'hover:after:scale-x-100'
                ].join(' ')
        ].join(' ');
    };

    const utilityButtonClass = [
        'h-11 w-11 rounded-full',
        'inline-flex items-center justify-center',
        'text-gray-300 hover:text-white',
        'bg-transparent hover:bg-white/10',
        'border border-transparent hover:border-white/10',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-gray-900'
    ].join(' ');

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="container mx-auto px-4">
                <div className="min-h-[72px] flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="group flex shrink-0 items-center gap-2 rounded-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    >
                        <FaTicketAlt className="text-xl transition-colors duration-200 group-hover:text-cyan-300" />

                        <span className="text-xl font-bold tracking-tight">
                            EventiQ
                        </span>
                    </Link>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <NavLink
                            to="/"
                            end
                            className={navLinkClass}
                        >
                            Home
                        </NavLink>

                        <span
                            aria-hidden="true"
                            className="hidden h-5 w-px bg-white/15 sm:block"
                        />

                        <NavLink
                            to="/events"
                            className={navLinkClass}
                        >
                            Events
                        </NavLink>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                        {user ? (
                            <>
                                <NavLink
                                    to={
                                        user.role === 'admin'
                                            ? '/admin'
                                            : '/dashboard'
                                    }
                                    aria-label={
                                        user.role === 'admin'
                                            ? 'Open admin dashboard'
                                            : 'Open profile'
                                    }
                                    title={
                                        user.role === 'admin'
                                            ? 'Admin dashboard'
                                            : 'Profile'
                                    }
                                    className={({
                                        isActive
                                    }) =>
                                        [
                                            'h-11 w-11 rounded-full',
                                            'inline-flex items-center justify-center',
                                            'transition-all duration-200',
                                            'focus:outline-none focus-visible:ring-2',
                                            'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                                            'focus-visible:ring-offset-gray-900',
                                            isActive
                                                ? [
                                                    'ring-2 ring-cyan-400',
                                                    'ring-offset-2 ring-offset-gray-900'
                                                ].join(' ')
                                                : 'hover:ring-2 hover:ring-white/30 hover:ring-offset-2 hover:ring-offset-gray-900'
                                        ].join(' ')
                                    }
                                >
                                    {user.role === 'admin' ? (
                                        <span className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-cyan-500/30 border border-white/15 inline-flex items-center justify-center text-cyan-200">
                                            <FaUserShield />
                                        </span>
                                    ) : (
                                        <img
                                            src={getAvatarSrc(user.avatar)}
                                            alt=""
                                            className="h-11 w-11 rounded-full border border-white/20 object-cover shadow-sm"
                                        />
                                    )}
                                </NavLink>

                                <div className="ml-1 flex h-11 w-11 items-center justify-center">
                                    <NotificationBell />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                    title="Logout"
                                    className={[
                                        utilityButtonClass,
                                        'hover:bg-red-500/10 hover:text-red-300',
                                        'hover:border-red-400/20'
                                    ].join(' ')}
                                >
                                    <FaSignOutAlt />
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
                                    className="ml-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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