import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const PendingRequests = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

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
            const relevantBookings = (res.data || []).filter(
                booking =>
                    booking.status === 'pending' ||
                    (booking.status === 'cancelled' && booking.paymentStatus === 'paid')
            );
            setRequests(relevantBookings);
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

    const handleInitiateRefund = (bookingId) => {
        navigate(`/admin/refunds/${bookingId}`);
    };

    const handleViewInvoice = async (booking) => {
        const invoiceWindow = window.open('', '_blank');

        try {
            setViewingInvoiceId(booking._id);

            if (invoiceWindow) {
                invoiceWindow.document.write(
                    '<p style="font-family: Arial, sans-serif; padding: 24px;">Loading invoice...</p>'
                );
            }

            const response = await api.get(
                `/bookings/${booking._id}/invoice`,
                {
                    responseType: 'blob'
                }
            );

            const invoiceUrl = URL.createObjectURL(
                new Blob([response.data], {
                    type: 'application/pdf'
                })
            );

            if (invoiceWindow) {
                invoiceWindow.location.href = invoiceUrl;
            } else {
                const link = document.createElement('a');
                link.href = invoiceUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            window.setTimeout(() => {
                URL.revokeObjectURL(invoiceUrl);
            }, 60000);
        } catch (error) {
            if (invoiceWindow) {
                invoiceWindow.close();
            }

            alert(
                error.response?.data?.message ||
                'Unable to open the invoice.'
            );
        } finally {
            setViewingInvoiceId(null);
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
                    <p className="text-gray-500 mt-1">
                        Review pending bookings and process refunds for paid bookings cancelled by users.
                    </p>
                </div>
                <button onClick={() => navigate('/admin')} className="inline-flex items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 px-4 py-2 text-sm font-semibold hover:bg-yellow-100 transition focus:outline-none focus:ring-2 focus:ring-yellow-300">
                    Back to Admin Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                        <li className="p-6 text-gray-500 text-center">
                            No pending requests or paid cancellations requiring review.
                        </li>
                    ) : requests.map(booking => (
                        <li
                            key={booking._id}
                            className={`p-6 hover:bg-gray-50 transition border-l-4 ${
                                booking.status === 'cancelled'
                                    ? 'border-l-red-400'
                                    : 'border-l-yellow-400'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.eventId?.title || 'Deleted Event'}</h4>
                                <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                        booking.status === 'cancelled'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {booking.status}
                                    </span>
                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                        booking.paymentStatus === 'paid'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}>
                                        {booking.paymentStatus.replace('_', ' ')}
                                    </span>
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
                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Tickets:</span>
                                    <span className="font-semibold">{Number(booking.quantity || 1)}</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Date:</span>
                                    <span>{new Date(booking.bookedAt).toLocaleString()}</span>
                                </p>
                            </div>
                            {booking.status === 'cancelled' && booking.paymentStatus === 'paid' && (
                                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-xs font-semibold leading-relaxed text-amber-900">
                                        This event was booked and paid for by the user and was later cancelled.
                                    </p>

                                    {booking.refund?.status && booking.refund.status !== 'not_started' ? (
                                        <div className="mt-3">
                                            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">Refund {booking.refund.status.replaceAll('_', ' ')} · ₹{booking.refund.amount}</div>
                                            <button type="button" onClick={() => handleInitiateRefund(booking._id)} className="mt-2 w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white">Manage Refund</button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => handleInitiateRefund(booking._id)} className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-600 hover:text-white">Initiate Refund</button>
                                    )}
                                </div>
                            )}

                            {booking.paymentStatus === 'paid' && (
                                <button
                                    type="button"
                                    onClick={() => handleViewInvoice(booking)}
                                    disabled={viewingInvoiceId === booking._id}
                                    className="w-full mb-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 border border-indigo-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition"
                                >
                                    {viewingInvoiceId === booking._id
                                        ? 'Opening Invoice...'
                                        : 'View / Download Invoice'}
                                </button>
                            )}

                            {booking.status === 'pending' && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {booking.paymentStatus === 'paid' && (
                                        <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-700 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                            ✓ Approve as Paid
                                        </button>
                                    )}
                                    <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                        ✓ Approve Undecided
                                    </button>
                                    <button onClick={() => handleCancelBooking(booking._id)} className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg transition">
                                        ✕ Reject
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PendingRequests;