import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle } from 'react-icons/fa';
import defaultAvatar from '../assets/default-avatar.png';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchBookings();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex items-center text-center sm:text-left gap-4 sm:gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <img
                            src={defaultAvatar}
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
                        <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> User Dashboard
                        </p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Link to="/events" className="hidden sm:inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                        Explore more events
                    </Link>
                    <Link to="/events" className="sm:hidden inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                        Explore
                    </Link>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <FaTicketAlt className="text-gray-700" /> My Bookings requests
                </h2>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-xl text-gray-500 mb-6 mt-4 font-medium">You haven't booked any events yet.</p>
                    <Link to="/" className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition shadow-md">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <div
                                key={booking._id}
                                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col border ${
                                    booking.status === 'confirmed' && booking.paymentStatus === 'paid' ? 'border-green-300 bg-green-50' :
                                    booking.status === 'pending' && booking.paymentStatus === 'paid' ? 'border-blue-300 bg-blue-50' :
                                    booking.status === 'cancelled' ? 'border-red-300 bg-red-50' :
                                    booking.status === 'pending' && booking.paymentStatus === 'not_paid' ? 'border-yellow-300 bg-yellow-50' :
                                    'border-gray-100'
                                }`}
                            >
                                <div className="p-6 border-b border-gray-50 flex-grow">
                                    {booking.eventId ? (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{booking.eventId.title}</h3>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {booking.paymentStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 mb-4 space-y-1">
                                                <p><strong className="text-gray-700">Date:</strong> {new Date(booking.eventId.date).toLocaleDateString()}</p>
                                                <p><strong className="text-gray-700">Amount:</strong> {booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</p>
                                                <p><strong className="text-gray-700">Requested:</strong> {new Date(booking.bookedAt).toLocaleDateString()}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-red-500 italic">Event details unavailable (might have been deleted)</p>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 flex flex-col gap-3 shrink-0">
                                    {booking.eventId && booking.status === 'confirmed' ? (
                                        <>
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <Link to={`/booking/${booking._id}/purchased`} className="text-gray-900 font-semibold text-sm hover:underline">View Event</Link>
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="text-red-500 font-semibold text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded"
                                                >
                                                    <FaTimesCircle /> Cancel
                                                </button>
                                            </div>
                                            <Link
                                                to={`/ticket/${booking._id}`}
                                                className="inline-flex justify-center w-full text-center bg-gray-900 text-white rounded-xl px-4 py-3 font-semibold hover:bg-black transition"
                                            >
                                                View Ticket
                                            </Link>
                                        </>
                                    ) : booking.eventId && booking.status === 'pending' ? (
                                        <>
                                            <div className="flex items-center justify-between gap-3">
                                                <Link to={`/booking/${booking._id}/purchased`} className="text-gray-900 font-semibold text-sm hover:underline">View Event</Link>
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="text-red-500 font-semibold text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded"
                                                >
                                                    <FaTimesCircle /> Cancel
                                                </button>
                                            </div>
                                            {booking.paymentStatus !== 'paid' ? (
                                                <Link
                                                    to={`/booking/${booking._id}/address`}
                                                    className="inline-flex justify-center w-full text-center bg-yellow-500 text-white rounded-xl px-4 py-3 font-semibold hover:bg-yellow-600 transition"
                                                >
                                                    Continue to Payment
                                                </Link>
                                            ) : (
                                                <button className="w-full bg-gray-200 text-gray-500 rounded-xl px-4 py-3 font-semibold cursor-not-allowed" disabled>
                                                    Ticket pending approval
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-sm text-gray-500 italic">Booking Cancelled</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
};

export default UserDashboard;