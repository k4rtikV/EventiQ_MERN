import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
}).format(Number(value || 0));

const InitiateRefund = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reason, setReason] = useState('User cancelled the paid booking');
    const [note, setNote] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        const loadBooking = async () => {
            try {
                const { data } = await api.get(`/bookings/${bookingId}`);

                if (data.status !== 'cancelled' || data.paymentStatus !== 'paid') {
                    setError('Only cancelled paid bookings are eligible for refund initiation.');
                    return;
                }

                setBooking(data);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load the booking.');
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [bookingId, navigate, user]);

    const invoiceNumber = useMemo(() => {
        if (!booking?._id) return '—';
        const year = new Date(booking.bookedAt || booking.createdAt).getFullYear();
        return `INV-${year}-${booking._id.slice(-8).toUpperCase()}`;
    }, [booking]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!window.confirm(`Initiate a refund of ${formatCurrency(booking.amount)} for this booking?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            const { data } = await api.post(`/bookings/${bookingId}/initiate-refund`, {
                refundAmount: Number(booking.amount),
                reason,
                note
            });

            setBooking(data.booking);
            setMessage(data.message);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to initiate the refund.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-lg font-semibold">Loading refund details...</div>;
    }

    return (
        <div className="mx-auto max-w-5xl py-6 sm:py-10">
            <button
                type="button"
                onClick={() => navigate('/admin')}
                className="group mb-6 inline-flex items-center gap-2 font-semibold text-gray-600 transition hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                Back to admin dashboard
            </button>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="bg-gray-950 px-6 py-7 text-white sm:px-8">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Payment Operations</p>
                    <h1 className="text-3xl font-black">Initiate Refund</h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-300">
                        Review the cancelled booking and notify the customer that their refund has been initiated.
                    </p>
                </div>

                {error && (
                    <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
                )}

                {message && (
                    <div className="m-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>
                )}

                {booking && (
                    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
                        <div>
                            <h2 className="mb-4 text-xl font-black text-gray-900 dark:text-white">Booking summary</h2>

                            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                                <div><p className="text-xs font-bold uppercase text-gray-500">Event</p><p className="mt-1 font-bold">{booking.eventId?.title || 'Deleted Event'}</p></div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div><p className="text-xs font-bold uppercase text-gray-500">Customer</p><p className="mt-1 font-semibold">{booking.userId?.name}</p><p className="text-sm text-gray-500">{booking.userId?.email}</p></div>
                                    <div><p className="text-xs font-bold uppercase text-gray-500">Invoice</p><p className="mt-1 font-semibold">{invoiceNumber}</p></div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div><p className="text-xs font-bold uppercase text-gray-500">Payment ID</p><p className="mt-1 break-all text-sm font-semibold">{booking.razorpayPaymentId || 'Not available'}</p></div>
                                    <div><p className="text-xs font-bold uppercase text-gray-500">Amount paid</p><p className="mt-1 text-xl font-black text-green-600">{formatCurrency(booking.amount)}</p></div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                                The booking was paid for and later cancelled. This action records the refund as initiated and sends an email notification to the customer.
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                            <h2 className="mb-5 text-xl font-black text-gray-900 dark:text-white">Refund details</h2>

                            <label className="mb-2 block text-sm font-bold">Refund amount</label>
                            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-lg font-black dark:border-gray-700 dark:bg-gray-800">
                                {formatCurrency(booking.amount)}
                            </div>

                            <label htmlFor="refund-reason" className="mb-2 block text-sm font-bold">Reason</label>
                            <select
                                id="refund-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                disabled={booking.refund?.status === 'initiated'}
                                className="mb-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option>User cancelled the paid booking</option>
                                <option>Event was cancelled</option>
                                <option>Duplicate payment</option>
                                <option>Booking could not be fulfilled</option>
                                <option>Other approved refund</option>
                            </select>

                            <label htmlFor="refund-note" className="mb-2 block text-sm font-bold">Internal note <span className="font-normal text-gray-500">(optional)</span></label>
                            <textarea
                                id="refund-note"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                maxLength={500}
                                rows={4}
                                disabled={booking.refund?.status === 'initiated'}
                                placeholder="Add a brief note for your records..."
                                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800"
                            />
                            <p className="mb-5 mt-1 text-right text-xs text-gray-500">{note.length}/500</p>

                            {booking.refund?.status === 'initiated' ? (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
                                    Refund already initiated on {new Date(booking.refund.initiatedAt).toLocaleString()}
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-lg bg-green-600 px-5 py-3.5 font-black text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Initiating Refund...' : 'Initiate Refund & Notify User'}
                                </button>
                            )}

                            <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
                                The customer will receive an email after this action is completed.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitiateRefund;