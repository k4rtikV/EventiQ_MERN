import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import AuthContext from './AuthContextValue';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const { data } = await api.post('/auth/login', { email: normalizedEmail, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password) => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const { data } = await api.post('/auth/register', { name, email: normalizedEmail, password });
            return data; // Returns { message, email }
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const { data } = await api.post('/auth/verify-otp', { email: normalizedEmail, otp });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    const updateStoredUser = (updatedUser) => {
        setUser((currentUser) => {
            const nextUser = {
                ...(currentUser || {}),
                ...updatedUser,
                token: currentUser?.token || updatedUser?.token
            };

            localStorage.setItem('userInfo', JSON.stringify(nextUser));
            return nextUser;
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, updateStoredUser, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
export default AuthProvider;
