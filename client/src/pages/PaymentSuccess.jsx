import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-t-8 border-green-500 transform transition-all hover:-translate-y-1 dark:bg-gray-900">
                <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6 drop-shadow-sm" />
                <h1 className="text-4xl font-black text-gray-900 mb-4 dark:text-gray-100">Booking Confirmed!</h1>
                <p className="text-gray-500 mb-8 text-lg dark:text-gray-400">Your ticket has been booked successfully. A confirmation email has been sent to your registered email address.</p>
                <div className="space-y-4">
                    <Link to="/dashboard" className="block w-full rounded-xl border border-green-400 bg-green-600 px-6 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-500 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 dark:border-green-400/60 dark:focus-visible:ring-offset-gray-900">
                        View My Tickets
                    </Link>
                    <Link to="/" className="block w-full rounded-xl border border-gray-300 bg-white px-6 py-4 font-bold text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-cyan-500 dark:hover:bg-gray-700 dark:hover:text-cyan-200 dark:focus-visible:ring-offset-gray-900">
                        Discover More Events
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;