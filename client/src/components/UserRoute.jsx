import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PageSkeleton from './ui/PageSkeleton';

const UserRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageSkeleton rows={3} />;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
};

export default UserRoute;
