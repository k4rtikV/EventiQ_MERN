import React from 'react';

const EventGridSkeleton = ({ count = 3 }) => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading events" aria-busy="true">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="h-48 animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-4 p-6"><div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-6 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-11 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" /></div>
            </div>
        ))}
    </div>
);

export default EventGridSkeleton;
