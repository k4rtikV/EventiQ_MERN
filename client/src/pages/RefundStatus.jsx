import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const labels = {
    initiated: 'Refund Initiated',
    processing: 'Processing',
    sent_to_bank: 'Sent to Bank',
    completed: 'Refund Completed',
    on_hold: 'On Hold',
    failed: 'Refund Failed'
};
const mainSteps = ['initiated', 'processing', 'sent_to_bank', 'completed'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));

const RefundStatus = () => {
    const { bookingId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        api.get(`/bookings/${bookingId}/refund-status`)
            .then(({ data }) => setBooking(data))
            .catch((err) => setError(err.response?.data?.message || 'Unable to load refund status.'))
            .finally(() => setLoading(false));
    }, [bookingId, navigate, user]);

    const activeIndex = useMemo(() => mainSteps.indexOf(booking?.refund?.status), [booking]);
    if (loading) return <div className="py-20 text-center text-lg font-semibold">Loading refund status...</div>;

    return (
        <div className="mx-auto max-w-5xl py-6 sm:py-10">
            <Link
                to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                className="group mb-6 inline-flex items-center gap-2 font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                Back to {user?.role === 'admin' ? 'admin dashboard' : 'dashboard'}
            </Link>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="bg-gray-950 px-6 py-8 text-white sm:px-9">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">Payment Operations</p>
                    <h1 className="mt-2 text-3xl font-black">Refund Status</h1>
                    <p className="mt-2 text-gray-300">Track the latest progress of your refund.</p>
                </div>
                {error ? <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div> : booking && (
                    <div className="p-6 sm:p-9">
                        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2 dark:border-gray-700 dark:bg-gray-800">
                            <div><p className="text-xs font-bold uppercase text-gray-500">Event</p><p className="mt-1 font-black">{booking.eventId?.title || 'Deleted Event'}</p></div>
                            <div><p className="text-xs font-bold uppercase text-gray-500">Booking ID</p><p className="mt-1 break-all font-semibold">{booking._id}</p></div>
                            <div><p className="text-xs font-bold uppercase text-gray-500">Refund amount</p><p className="mt-1 text-xl font-black text-green-600">{money(booking.refund?.amount)}</p></div>
                            <div><p className="text-xs font-bold uppercase text-gray-500">Refund reference</p><p className="mt-1 font-black text-blue-700 dark:text-blue-300">{booking.refund?.referenceId || 'Being generated'}</p></div>
                            <div><p className="text-xs font-bold uppercase text-gray-500">Current status</p><p className="mt-1 font-black">{labels[booking.refund?.status]}</p></div>
                            <div><p className="text-xs font-bold uppercase text-gray-500">Last updated</p><p className="mt-1 font-semibold">{new Date(booking.refund?.lastUpdatedAt || booking.refund?.initiatedAt).toLocaleString()}</p></div>
                        </div>

                        {['on_hold', 'failed'].includes(booking.refund?.status) && (
                            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">
                                {labels[booking.refund.status]}{booking.refund.note ? ` — ${booking.refund.note}` : ''}
                            </div>
                        )}

                        <div className="mt-8">
                            <h2 className="mb-5 text-xl font-black">Refund progress</h2>
                            <div className="space-y-0">
                                {mainSteps.map((step, index) => {
                                    const complete = activeIndex >= index || booking.refund?.status === 'completed';
                                    return (
                                        <div key={step} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-black ${complete ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-400 dark:bg-gray-900'}`}>{complete ? '✓' : index + 1}</div>
                                                {index < mainSteps.length - 1 && <div className={`h-14 w-0.5 ${activeIndex > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                                            </div>
                                            <div className="pt-1"><p className="font-black">{labels[step]}</p><p className="mt-1 text-sm text-gray-500">{booking.refund?.history?.find((item) => item.status === step)?.note || (complete ? 'Stage completed.' : 'Pending')}</p></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {booking.refund?.history?.length > 0 && (
                            <div className="mt-8 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
                                <h2 className="mb-4 text-lg font-black">Update history</h2>
                                <div className="space-y-3">
                                    {[...booking.refund.history].reverse().map((item, index) => (
                                        <div key={`${item.status}-${item.updatedAt}-${index}`} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                                            <div className="flex flex-wrap justify-between gap-2"><span className="font-black">{labels[item.status]}</span><span className="text-xs text-gray-500">{new Date(item.updatedAt).toLocaleString()}</span></div>
                                            {item.note && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.note}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RefundStatus;