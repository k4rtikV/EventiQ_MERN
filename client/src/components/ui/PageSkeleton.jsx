import React from 'react';

const PageSkeleton = ({ rows = 4 }) => (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6" aria-label="Loading page" aria-busy="true">
        <div className="h-10 w-64 rounded bg-gray-200 dark:bg-gray-700" />
        {Array.from({ length: rows }).map((_, index) => <div key={index} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}
    </div>
);
export default PageSkeleton;
