import React from 'react';

const variants = {
    primary: 'border-blue-500/70 bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-cyan-400',
    secondary: 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    danger: 'border-red-500/60 bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400',
    success: 'border-emerald-500/60 bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400',
    ghost: 'border-transparent bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10'
};

const Button = ({ variant = 'primary', loading = false, disabled = false, className = '', children, ...props }) => (
    <button
        {...props}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-2.5 font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant] || variants.primary} ${className}`}
    >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
        {children}
    </button>
);

export default Button;
