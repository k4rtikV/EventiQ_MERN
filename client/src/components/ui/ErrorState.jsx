import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
    <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/60 dark:bg-red-950/30">
        <FaExclamationTriangle className="mx-auto mb-4 text-4xl text-red-500" />
        <h3 className="text-xl font-black text-red-900 dark:text-red-200">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-red-700 dark:text-red-300">{message || 'Please try again.'}</p>
        {onRetry && <Button variant="danger" className="mt-6" onClick={onRetry}>Try again</Button>}
    </div>
);

export default ErrorState;
