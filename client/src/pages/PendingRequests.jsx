import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const PendingRequests = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchPending();
    }, [user, navigate]);

    const fetchPending = async () => {
        try {
            const res = await api.get('/bookings/admin/all');
            const pendingBookings = (res.data || []).filter(b => b.status === 'pending');
            setPending(pendingBookings);
        } catch (error) {
            console.error('Error fetching pending bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchPending();
        } catch (error) {
            alert(error.response?.data?.message || 'Error confirming booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this user\'s booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchPending();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading pending requests...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-4 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/admin')} className="font-medium text-yellow-700 hover:text-yellow-900 transition">Admin Dashboard</button>
                <span className="text-gray-300">›</span>
                <span>Pending Requests</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold">Pending Requests</h1>
                    <p className="text-gray-500 mt-1">All bookings waiting for admin review and action.</p>
                </div>
                <button onClick={() => navigate('/admin')} className="inline-flex items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 px-4 py-2 text-sm font-semibold hover:bg-yellow-100 transition focus:outline-none focus:ring-2 focus:ring-yellow-300">
                    Back to Admin Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {pending.length === 0 ? (
                        <li className="p-6 text-gray-500 text-center">No pending booking requests.</li>
                    ) : pending.map(booking => (
                        <li key={booking._id} className="p-6 hover:bg-gray-50 transition border-l-4 border-l-yellow-400">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.eventId?.title || 'Deleted Event'}</h4>
                                <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                    <span className="px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-yellow-100 text-yellow-700">pending</span>
                                    {booking.status !== 'cancelled' && <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-800'}`}>{booking.paymentStatus.replace('_', ' ')}</span>}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">User:</span>
                                    <span className="font-semibold">{booking.userId?.name}</span>
                                    <span className="text-gray-400">({booking.userId?.email})</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Amount:</span>
                                    <span className={`font-semibold ${booking.amount === 0 ? 'text-green-600' : ''}`}>{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Date:</span>
                                    <span>{new Date(booking.bookedAt).toLocaleString()}</span>
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-700 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                    ✓ Approve as Paid
                                </button>
                                <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                    ✓ Approve Undecided
                                </button>
                                <button onClick={() => handleCancelBooking(booking._id)} className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg transition">
                                    ✕ Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PendingRequests;
