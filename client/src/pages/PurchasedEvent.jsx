import React, {
    useContext,
    useEffect,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    FaArrowLeft,
    FaCalendarAlt,
    FaChair,
    FaDownload,
    FaExclamationTriangle,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaTicketAlt
} from 'react-icons/fa';

import api from '../utils/axios';

import {
    AuthContext
} from '../context/AuthContext';

const PurchasedEvent = () => {
    const {
        id
    } = useParams();

    const navigate = useNavigate();

    const {
        user
    } = useContext(AuthContext);

    const [
        booking,
        setBooking
    ] = useState(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState('');

    const [
        downloadingInvoice,
        setDownloadingInvoice
    ] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchBooking = async () => {
            try {
                const {
                    data
                } = await api.get(
                    `/bookings/${id}`
                );

                setBooking(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load booking'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [
        id,
        user,
        navigate
    ]);

    const downloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            setError('');

            const response = await api.get(
                `/bookings/${id}/invoice`,
                {
                    responseType: 'blob'
                }
            );

            const year = new Date(
                booking.bookedAt ||
                booking.createdAt
            ).getFullYear();

            const invoiceNumber =
                `INV-${year}-${booking._id
                    .slice(-8)
                    .toUpperCase()}`;

            const url =
                URL.createObjectURL(
                    response.data
                );

            const link =
                document.createElement('a');

            link.href = url;
            link.download =
                `${invoiceNumber}.pdf`;

            document.body.appendChild(link);

            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to download invoice'
            );
        } finally {
            setDownloadingInvoice(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Loading...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-red-500 mb-5">
                    {error || 'Booking not found'}
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate('/dashboard')
                    }
                    className="group inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                    <FaArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                    Back to dashboard
                </button>
            </div>
        );
    }

    const event =
        booking.eventId || {};

    const isPaid =
        booking.paymentStatus === 'paid';

    const isPaidPending =
        isPaid &&
        booking.status === 'pending';

    const isPaidConfirmed =
        isPaid &&
        booking.status === 'confirmed';

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <button
                type="button"
                onClick={() =>
                    navigate('/dashboard')
                }
                className="group inline-flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
                <FaArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                Back to dashboard
            </button>

            {error && (
                <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl p-4">
                    <FaExclamationTriangle className="mt-0.5 shrink-0" />

                    <p className="text-sm font-medium">
                        {error}
                    </p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {event.image ? (
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-80 object-cover"
                    />
                ) : (
                    <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                        {event.category}
                    </div>
                )}

                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                        <div className="flex-1">
                            <div className="inline-block bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                                {event.category}
                            </div>

                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                                {event.title}
                            </h1>

                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                                {event.description}
                            </p>

                            <div
                                className={`mb-4 p-4 rounded-lg border ${
                                    isPaidConfirmed
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
                                        : isPaidPending
                                          ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-900'
                                          : 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-900'
                                }`}
                            >
                                {isPaidPending && (
                                    <>
                                        <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                                            Payment received. Your
                                            ticket is awaiting admin
                                            approval.
                                        </p>

                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                            You can download your
                                            invoice now or contact
                                            support if ticket
                                            assignment is delayed.
                                        </p>
                                    </>
                                )}

                                {isPaidConfirmed && (
                                    <p className="font-semibold text-green-700 dark:text-green-300">
                                        Your booking is confirmed
                                        and your ticket is ready.
                                    </p>
                                )}

                                {!isPaid && (
                                    <p className="font-semibold text-orange-700 dark:text-orange-300">
                                        Complete payment to finish
                                        this booking.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-xl border border-gray-100 dark:border-gray-800 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                                Booking Details
                            </h3>

                            <div className="space-y-4 mb-8">
                                <Detail
                                    icon={
                                        <FaMoneyBillWave />
                                    }
                                    label="Amount paid"
                                >
                                    {Number(
                                        booking.amount
                                    ) === 0
                                        ? 'Free'
                                        : `₹${Number(
                                              booking.amount
                                          ).toLocaleString(
                                              'en-IN'
                                          )}`}
                                </Detail>

                                <Detail
                                    icon={<FaChair />}
                                    label="Tickets booked"
                                >
                                    {Number(booking.quantity || 1)}
                                </Detail>

                                <Detail
                                    icon={<FaChair />}
                                    label="Availability"
                                >
                                    {event.availableSeats}{' '}
                                    / {event.totalSeats}
                                </Detail>

                                <Detail
                                    icon={
                                        <FaCalendarAlt />
                                    }
                                    label="Date"
                                >
                                    {event.date
                                        ? new Date(
                                              event.date
                                          ).toLocaleDateString()
                                        : ''}
                                </Detail>

                                <Detail
                                    icon={
                                        <FaMapMarkerAlt />
                                    }
                                    label="Location"
                                >
                                    {event.location}
                                </Detail>
                            </div>

                            <div className="space-y-3">
                                {isPaidConfirmed && (
                                    <Link
                                        to={`/ticket/${booking._id}`}
                                        className="group inline-flex items-center justify-center gap-2 w-full bg-gray-900 dark:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl text-center hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                    >
                                        <FaTicketAlt className="transition-transform duration-200 group-hover:scale-110" />
                                        View Ticket
                                    </Link>
                                )}

                                {isPaid && (
                                    <button
                                        type="button"
                                        onClick={
                                            downloadInvoice
                                        }
                                        disabled={
                                            downloadingInvoice
                                        }
                                        className="group inline-flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-semibold py-3 px-4 rounded-xl text-center hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                    >
                                        {downloadingInvoice ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <FaDownload className="transition-transform duration-200 group-hover:translate-y-0.5" />
                                                Download Invoice
                                            </>
                                        )}
                                    </button>
                                )}

                                {isPaidPending && (
                                    <Link
                                        to={`/support/ticket-delay/${booking._id}`}
                                        className="group inline-flex items-center justify-center gap-2 w-full bg-red-600 text-white border border-red-600 font-semibold py-3 px-4 rounded-xl text-center hover:bg-red-700 hover:border-red-700 hover:-translate-y-[2px] hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                    >
                                        <FaExclamationTriangle className="transition-transform duration-200 group-hover:scale-110" />
                                        Ticket delayed? Contact support
                                    </Link>
                                )}

                                {!isPaid &&
                                    booking.status !==
                                        'cancelled' && (
                                        <Link
                                            to={`/booking/${booking._id}/address`}
                                            className="group inline-flex items-center justify-center gap-2 w-full bg-yellow-500 text-white font-semibold py-3 px-4 rounded-xl text-center hover:bg-yellow-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                        >
                                            <FaMoneyBillWave className="transition-transform duration-200 group-hover:scale-110" />
                                            Continue to Payment
                                        </Link>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Detail = ({
    icon,
    label,
    children
}) => (
    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white shrink-0">
            {icon}
        </div>

        <div>
            <p className="text-sm font-semibold text-gray-400 uppercase">
                {label}
            </p>

            <p className="font-bold text-gray-800 dark:text-white">
                {children}
            </p>
        </div>
    </div>
);

export default PurchasedEvent;