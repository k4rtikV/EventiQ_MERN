import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const ContactUs = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/support', formData);
            setSubmitted(true);
            setStatusMessage('Thanks for reaching out! Your support query has been sent.');
        } catch (error) {
            console.error('Support form error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unable to send your message right now. Please try again later.';
            setStatusMessage(errorMessage);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-gray-700 leading-8 mb-8">
                Have a question or need support? Fill out the form below and we’ll get back to you as soon as possible.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-3">Customer Support</h2>
                        <p className="text-gray-700 leading-7">Email: kavx1734@gmail.com</p>
                        <p className="text-gray-700 leading-7">Phone: +91 91679 63477</p>
                        <p className="text-gray-700 leading-7">Address: Thane, Mumbai 400604</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-3">Office Hours</h2>
                        <p className="text-gray-700 leading-7">Monday - Friday: 9:00 AM - 6:00 PM</p>
                        <p className="text-gray-700 leading-7">Saturday: 10:00 AM - 4:00 PM</p>
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                    {submitted ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-3">Thanks for reaching out!</h2>
                            <p className="text-gray-700 leading-7">{statusMessage}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 min-h-[160px]"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold hover:bg-black transition"
                            >
                                Send Message
                            </button>
                            {statusMessage && !submitted && (
                                <p className="text-red-600 text-sm mt-2">{statusMessage}</p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
