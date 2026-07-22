import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiSend
} from 'react-icons/fi';
import api from '../utils/axios';

const Footer = () => {
    const [newsletterData, setNewsletterData] =
        useState({
            name: '',
            email: ''
        });

    const [newsletterLoading, setNewsletterLoading] =
        useState(false);

    const [newsletterMessage, setNewsletterMessage] =
        useState('');

    const [newsletterError, setNewsletterError] =
        useState('');

    const handleNewsletterChange = (event) => {
        const { name, value } = event.target;

        setNewsletterData((previous) => ({
            ...previous,
            [name]: value
        }));

        setNewsletterMessage('');
        setNewsletterError('');
    };

    const handleNewsletterSubmit = async (
        event
    ) => {
        event.preventDefault();

        const name =
            newsletterData.name.trim();

        const email =
            newsletterData.email
                .trim()
                .toLowerCase();

        if (!name) {
            setNewsletterError(
                'Please enter your name.'
            );

            return;
        }

        if (!email) {
            setNewsletterError(
                'Please enter your email address.'
            );

            return;
        }

        setNewsletterLoading(true);
        setNewsletterMessage('');
        setNewsletterError('');

        try {
            const { data } = await api.post(
                '/newsletter/subscribe',
                {
                    name,
                    email
                }
            );

            setNewsletterMessage(
                data.message ||
                    'You are subscribed. Check your email for the promo code.'
            );

            setNewsletterData({
                name: '',
                email: ''
            });
        } catch (error) {
            setNewsletterError(
                error.response?.data?.message ||
                    'Unable to subscribe right now. Please try again.'
            );
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <footer className="bg-gray-900 text-gray-200 py-12 mt-12">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-start">
                    <div className="w-full max-w-lg mx-auto lg:mx-0">
                        <h3 className="text-xl font-bold text-white mb-4">
                            EventiQ
                        </h3>

                        <p className="text-gray-400 leading-7">
                            EventiQ makes booking
                            events easier with a
                            modern interface and
                            secure payment flow.
                            Discover, book, and
                            manage your events from
                            one place.
                        </p>

                        <div className="mt-6">
                            <h4 className="text-base font-bold text-white">
                                Get 10% off your next
                                booking
                            </h4>

                            <p className="text-sm text-gray-400 mt-2 leading-6">
                                Join our newsletter
                                and receive the promo
                                code directly in your
                                email.
                            </p>

                            <form
                                onSubmit={
                                    handleNewsletterSubmit
                                }
                                className="mt-4 space-y-3"
                            >
                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        newsletterData.name
                                    }
                                    onChange={
                                        handleNewsletterChange
                                    }
                                    maxLength={80}
                                    placeholder="Your name"
                                    autoComplete="name"
                                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-700"
                                />

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            newsletterData.email
                                        }
                                        onChange={
                                            handleNewsletterChange
                                        }
                                        placeholder="Your email address"
                                        autoComplete="email"
                                        className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-700"
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            newsletterLoading
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FiSend />

                                        {newsletterLoading
                                            ? 'Sending...'
                                            : 'Subscribe'}
                                    </button>
                                </div>
                            </form>

                            {newsletterMessage && (
                                <p className="mt-3 text-sm leading-5 text-green-400">
                                    {
                                        newsletterMessage
                                    }
                                </p>
                            )}

                            {newsletterError && (
                                <p className="mt-3 text-sm leading-5 text-red-400">
                                    {
                                        newsletterError
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-xs mx-auto">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Quick Links
                        </h3>

                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link
                                    to="/about-us"
                                    className="transition hover:text-white"
                                >
                                    About Us
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/faqs"
                                    className="transition hover:text-white"
                                >
                                    FAQs
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/refund-policy"
                                    className="transition hover:text-white"
                                >
                                    Refund Policy
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/contact-us"
                                    className="transition hover:text-white"
                                >
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="w-full max-w-sm mx-auto">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Contact
                        </h3>

                        <div className="space-y-3 text-gray-400">
                            <Link
                                to="/contact-us"
                                className="flex items-center gap-3 transition hover:text-white"
                            >
                                <FiMail className="shrink-0 text-gray-300" />

                                <span>
                                    kavx1734@gmail.com
                                </span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <FiPhone className="shrink-0 text-gray-300" />

                                <span>
                                    +91 91679 63477
                                </span>
                            </div>

                            <p className="flex items-start gap-3 pt-1">
                                <FiMapPin className="mt-1 shrink-0 text-gray-300" />

                                <span>
                                    Thane, Mumbai
                                    400604
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
                    ©{' '}
                    {new Date().getFullYear()}{' '}
                    EventiQ. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;