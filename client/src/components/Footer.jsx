import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-200 py-10 mt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">EventiQ</h3>
                    <p className="text-gray-400 leading-7">
                        EventiQ makes booking events easier with a modern interface and secure payment flow. Discover, book, and manage your events from one place.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li><Link to="/about-us" className="hover:text-white">About Us</Link></li>
                        <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
                        <li><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
                        <li><Link to="/contact-us" className="hover:text-white">Contact Us</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
                    <p className="text-gray-400 leading-7 flex items-center gap-2"><FiMail className="text-gray-300" /> kavx1734@gmail.com</p>
                    <p className="text-gray-400 leading-7 flex items-center gap-2"><FiPhone className="text-gray-300" /> +91 91679 63477</p>
                    <p className="text-gray-400 leading-7 mt-4 flex items-center gap-2"><FiMapPin className="text-gray-300" /> Thane, Mumbai 400604</p>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10 border-t border-gray-800 pt-6 text-gray-500 text-sm text-center">
                © {new Date().getFullYear()} EventiQ. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
