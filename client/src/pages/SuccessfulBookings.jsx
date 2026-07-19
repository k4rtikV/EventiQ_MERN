import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const SuccessfulBookings = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings/admin/all'); // admin gets all bookings
            const data = res.data || [];
            const successful = data.filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid');
            setBookings(successful);
        } catch (error) {
            console.error('Error fetching successful bookings', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading successful bookings...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-4 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/admin')} className="font-medium text-green-700 hover:text-green-900 transition">Admin Dashboard</button>
                <span className="text-gray-300">›</span>
                <span>Successful Bookings</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold">Successful Bookings</h1>
                    <p className="text-gray-500 mt-1">All confirmed bookings with completed payment.</p>
                </div>
                <button onClick={() => navigate('/admin')} className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 text-sm font-semibold hover:bg-green-100 transition focus:outline-none focus:ring-2 focus:ring-green-300">
                    Back to Admin Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {bookings.length === 0 ? (
                        <li className="p-6 text-gray-500 text-center">No successful bookings yet.</li>
                    ) : bookings.map(booking => (
                        <li key={booking._id} className="p-6 hover:bg-gray-50 transition border-l-4 border-l-green-400">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.eventId?.title || 'Deleted Event'}</h4>
                                <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-green-100 text-green-700`}>confirmed</span>
                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-indigo-100 text-indigo-700`}>paid</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-20 text-gray-500 uppercase text-xs">User:</span>
                                    <span className="font-semibold">{booking.userId?.name}</span>
                                    <span className="text-gray-400">({booking.userId?.email})</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-20 text-gray-500 uppercase text-xs">Amount:</span>
                                    <span className="font-semibold">{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-20 text-gray-500 uppercase text-xs">Date:</span>
                                    <span>{new Date(booking.bookedAt).toLocaleString()}</span>
                                </p>
                                {booking.eventId && (
                                    <p className="text-gray-700 flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                        <span className="font-bold w-20 text-gray-500 uppercase text-xs">Seats:</span>
                                        <span className={`font-bold ${booking.eventId.availableSeats > 0 ? 'text-green-600' : 'text-red-500'}`}>{booking.eventId.availableSeats}</span> remaining of {booking.eventId.totalSeats}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SuccessfulBookings;
