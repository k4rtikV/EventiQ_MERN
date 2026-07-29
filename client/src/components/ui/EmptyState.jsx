import React from 'react';
import { Link } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({ icon: Icon = FaInbox, title, message, actionLabel, actionTo, onAction }) => (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl text-gray-500 dark:bg-gray-800 dark:text-gray-300"><Icon /></div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
        {message && <p className="mx-auto mt-2 max-w-md text-gray-500 dark:text-gray-400">{message}</p>}
        {actionLabel && actionTo && <Link to={actionTo} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-500">{actionLabel}</Link>}
        {actionLabel && onAction && <button type="button" onClick={onAction} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-500">{actionLabel}</button>}
    </div>
);

export default EmptyState;
