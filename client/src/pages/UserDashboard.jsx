import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaDownload,
    FaExclamationTriangle,
    FaHeart,
    FaList,
    FaTicketAlt,
    FaTimesCircle
} from 'react-icons/fa';

import {
    AuthContext
} from '../context/AuthContext';

import api from '../utils/axios';
import defaultAvatar from '../assets/default-avatar.png';

const FILTERS = {
    ALL: 'all',
    CANCELLED: 'cancelled',
    TICKET_RECEIVED: 'ticket_received',
    AWAITING_TICKET: 'awaiting_ticket',
    PAYMENT_INCOMPLETE: 'payment_incomplete'
};

const UserDashboard = () => {
    const {
        user
    } = useContext(AuthContext);

    const navigate = useNavigate();

    const [
        bookings,
        setBookings
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        activeFilter,
        setActiveFilter
    ] = useState(FILTERS.ALL);

    const [
        downloadingInvoiceId,
        setDownloadingInvoiceId
    ] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const {
                data
            } = await api.get('/bookings/my');

            setBookings(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                'Error fetching bookings',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (
        bookingId
    ) => {
        const shouldCancel =
            window.confirm(
                'Are you sure you want to cancel this booking request?'
            );

        if (!shouldCancel) {
            return;
        }

        try {
            await api.delete(
                `/bookings/${bookingId}`
            );

            await fetchBookings();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Error cancelling booking'
            );
        }
    };

    const downloadInvoice = async (
        booking
    ) => {
        try {
            setDownloadingInvoiceId(
                booking._id
            );

            const response = await api.get(
                `/bookings/${booking._id}/invoice`,
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
        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Unable to download invoice'
            );
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    const bookingMatchesFilter = (
        booking,
        filter
    ) => {
        const isCancelled =
            booking.status === 'cancelled';

        const isPaid =
            booking.paymentStatus === 'paid';

        const hasTicket =
            booking.status === 'confirmed' &&
            isPaid;

        const isAwaitingTicket =
            booking.status === 'pending' &&
            isPaid;

        const isPaymentIncomplete =
            !isCancelled &&
            booking.paymentStatus !== 'paid';

        switch (filter) {
            case FILTERS.CANCELLED:
                return isCancelled;

            case FILTERS.TICKET_RECEIVED:
                return hasTicket;

            case FILTERS.AWAITING_TICKET:
                return isAwaitingTicket;

            case FILTERS.PAYMENT_INCOMPLETE:
                return isPaymentIncomplete;

            case FILTERS.ALL:
            default:
                return true;
        }
    };

    const filterCounts = useMemo(
        () => ({
            [FILTERS.ALL]:
                bookings.length,

            [FILTERS.CANCELLED]:
                bookings.filter(
                    (booking) =>
                        bookingMatchesFilter(
                            booking,
                            FILTERS.CANCELLED
                        )
                ).length,

            [FILTERS.TICKET_RECEIVED]:
                bookings.filter(
                    (booking) =>
                        bookingMatchesFilter(
                            booking,
                            FILTERS.TICKET_RECEIVED
                        )
                ).length,

            [FILTERS.AWAITING_TICKET]:
                bookings.filter(
                    (booking) =>
                        bookingMatchesFilter(
                            booking,
                            FILTERS.AWAITING_TICKET
                        )
                ).length,

            [FILTERS.PAYMENT_INCOMPLETE]:
                bookings.filter(
                    (booking) =>
                        bookingMatchesFilter(
                            booking,
                            FILTERS.PAYMENT_INCOMPLETE
                        )
                ).length
        }),
        [bookings]
    );

    const filteredBookings =
        useMemo(
            () =>
                bookings.filter(
                    (booking) =>
                        bookingMatchesFilter(
                            booking,
                            activeFilter
                        )
                ),
            [
                bookings,
                activeFilter
            ]
        );

    const filterButtons = [
        {
            value: FILTERS.ALL,
            label: 'All',
            icon: FaList
        },
        {
            value:
                FILTERS.TICKET_RECEIVED,
            label: 'Tickets Received',
            icon: FaTicketAlt
        },
        {
            value:
                FILTERS.AWAITING_TICKET,
            label: 'Awaiting Ticket',
            icon: FaClock
        },
        {
            value:
                FILTERS.PAYMENT_INCOMPLETE,
            label: 'Payment Incomplete',
            icon: FaCreditCard
        },
        {
            value: FILTERS.CANCELLED,
            label: 'Cancelled',
            icon: FaTimesCircle
        }
    ];

    const getCardStyle = (
        booking
    ) => {
        if (
            booking.status === 'cancelled'
        ) {
            return 'border-red-300 bg-red-50 dark:border-red-900/70 dark:bg-red-950/30';
        }

        if (
            booking.status === 'confirmed' &&
            booking.paymentStatus === 'paid'
        ) {
            return 'border-green-300 bg-green-50 dark:border-green-900/70 dark:bg-green-950/30';
        }

        if (
            booking.status === 'pending' &&
            booking.paymentStatus === 'paid'
        ) {
            return 'border-blue-300 bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/30';
        }

        if (
            booking.paymentStatus !== 'paid'
        ) {
            return 'border-yellow-300 bg-yellow-50 dark:border-yellow-900/70 dark:bg-yellow-950/30';
        }

        return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center text-center sm:text-left gap-6 transition-colors">
                <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                        <img
                            src={defaultAvatar}
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col items-center sm:items-start">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Welcome, {user?.name}!
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            User Dashboard
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-auto sm:ml-auto flex flex-col gap-2.5">
                    <Link
                        to="/events"
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition"
                    >
                        <span className="hidden sm:inline">
                            Explore more events
                        </span>

                        <span className="sm:hidden">
                            Explore Events
                        </span>
                    </Link>

                    <Link
                        to="/wishlist"
                        className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold py-2.5 px-5 rounded-lg transition"
                    >
                        <FaHeart />
                        My Wishlist
                    </Link>
                </div>
            </section>

            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 sm:gap-3">
                    <FaTicketAlt className="text-gray-700 dark:text-gray-300" />
                    My Booking Requests
                </h2>
            </div>

            {bookings.length > 0 && (
                <section className="mb-7">
                    <div className="flex flex-wrap gap-2.5">
                        {filterButtons.map(
                            ({
                                value,
                                label,
                                icon: Icon
                            }) => {
                                const isActive =
                                    activeFilter ===
                                    value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            setActiveFilter(
                                                value
                                            )
                                        }
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                                            isActive
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <Icon />

                                        <span>
                                            {label}
                                        </span>

                                        <span
                                            className={`min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center text-xs ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                            }`}
                                        >
                                            {
                                                filterCounts[
                                                    value
                                                ]
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}
                    </div>

                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Showing{' '}
                        <strong className="text-gray-700 dark:text-gray-200">
                            {
                                filteredBookings.length
                            }
                        </strong>{' '}
                        of{' '}
                        <strong className="text-gray-700 dark:text-gray-200">
                            {bookings.length}
                        </strong>{' '}
                        bookings
                    </p>
                </section>
            )}

            {bookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-gray-300 dark:text-gray-600 text-3xl" />
                    </div>

                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 mt-4 font-medium">
                        You haven't booked any events yet.
                    </p>

                    <Link
                        to="/events"
                        className="inline-block bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-md"
                    >
                        Browse Events
                    </Link>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
                    <FaCheckCircle className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        No bookings in this category
                    </h3>

                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Select another filter to
                        view your other bookings.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setActiveFilter(
                                FILTERS.ALL
                            )
                        }
                        className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                    >
                        Show all bookings
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map(
                        (booking) => (
                            <article
                                key={booking._id}
                                className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col border ${getCardStyle(
                                    booking
                                )}`}
                            >
                                <div className="p-6 border-b border-gray-200/70 dark:border-gray-700/70 flex-grow">
                                    {booking.eventId ? (
                                        <>
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                    {
                                                        booking
                                                            .eventId
                                                            .title
                                                    }
                                                </h3>

                                                <div className="flex flex-col gap-1 items-end shrink-0">
                                                    <span
                                                        className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                            booking.status ===
                                                            'confirmed'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                                                : booking.status ===
                                                                    'cancelled'
                                                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                                                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300'
                                                        }`}
                                                    >
                                                        {
                                                            booking.status
                                                        }
                                                    </span>

                                                    {booking.status !==
                                                        'cancelled' && (
                                                        <span
                                                            className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                                booking.paymentStatus ===
                                                                'paid'
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                                            }`}
                                                        >
                                                            {booking.paymentStatus.replace(
                                                                '_',
                                                                ' '
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                                                <p>
                                                    <strong className="text-gray-700 dark:text-gray-200">
                                                        Date:
                                                    </strong>{' '}
                                                    {new Date(
                                                        booking
                                                            .eventId
                                                            .date
                                                    ).toLocaleDateString()}
                                                </p>

                                                <p>
                                                    <strong className="text-gray-700 dark:text-gray-200">
                                                        Amount:
                                                    </strong>{' '}
                                                    {Number(
                                                        booking.amount
                                                    ) === 0
                                                        ? 'Free'
                                                        : `₹${Number(
                                                              booking.amount
                                                          ).toLocaleString(
                                                              'en-IN'
                                                          )}`}
                                                </p>

                                                <p>
                                                    <strong className="text-gray-700 dark:text-gray-200">
                                                        Requested:
                                                    </strong>{' '}
                                                    {new Date(
                                                        booking.bookedAt ||
                                                        booking.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-red-500 dark:text-red-400 italic">
                                            Event details
                                            unavailable
                                        </p>
                                    )}
                                </div>

                                <div className="p-4 bg-white/60 dark:bg-gray-900/50 flex flex-col gap-3 shrink-0">
                                    {booking.eventId &&
                                    booking.status ===
                                        'confirmed' &&
                                    booking.paymentStatus ===
                                        'paid' ? (
                                        <>
                                            <div className="flex items-center justify-between gap-3">
                                                <Link
                                                    to={`/booking/${booking._id}/purchased`}
                                                    className="text-gray-900 dark:text-gray-100 font-semibold text-sm hover:underline"
                                                >
                                                    View Event
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelBooking(
                                                            booking._id
                                                        )
                                                    }
                                                    className="text-red-500 dark:text-red-400 font-semibold text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded"
                                                >
                                                    <FaTimesCircle />
                                                    Cancel
                                                </button>
                                            </div>

                                            <Link
                                                to={`/ticket/${booking._id}`}
                                                className="inline-flex justify-center w-full text-center bg-gray-900 dark:bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                            >
                                                View Ticket
                                            </Link>

                                            <button
                                                type="button"
                                                disabled={
                                                    downloadingInvoiceId ===
                                                    booking._id
                                                }
                                                onClick={() =>
                                                    downloadInvoice(
                                                        booking
                                                    )
                                                }
                                                className="group inline-flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-xl px-4 py-3 font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                            >
                                                <FaDownload className="transition-transform duration-200 group-hover:translate-y-0.5" />

                                                {downloadingInvoiceId ===
                                                booking._id
                                                    ? 'Downloading...'
                                                    : 'Download Invoice'}
                                            </button>
                                        </>
                                    ) : booking.eventId &&
                                      booking.status ===
                                          'pending' ? (
                                        <>
                                            <div className="flex items-center justify-between gap-3">
                                                <Link
                                                    to={`/booking/${booking._id}/purchased`}
                                                    className="text-gray-900 dark:text-gray-100 font-semibold text-sm hover:underline"
                                                >
                                                    View Event
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelBooking(
                                                            booking._id
                                                        )
                                                    }
                                                    className="text-red-500 dark:text-red-400 font-semibold text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded"
                                                >
                                                    <FaTimesCircle />
                                                    Cancel
                                                </button>
                                            </div>

                                            {booking.paymentStatus !==
                                            'paid' ? (
                                                <Link
                                                    to={`/booking/${booking._id}/address`}
                                                    className="inline-flex justify-center w-full text-center bg-yellow-500 text-white rounded-xl px-4 py-3 font-semibold hover:bg-yellow-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                                >
                                                    Continue to Payment
                                                </Link>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl px-4 py-3 font-semibold cursor-not-allowed"
                                                    >
                                                        Ticket pending approval
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            downloadingInvoiceId ===
                                                            booking._id
                                                        }
                                                        onClick={() =>
                                                            downloadInvoice(
                                                                booking
                                                            )
                                                        }
                                                        className="group inline-flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-xl px-4 py-3 font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                                    >
                                                        <FaDownload className="transition-transform duration-200 group-hover:translate-y-0.5" />

                                                        {downloadingInvoiceId ===
                                                        booking._id
                                                            ? 'Downloading...'
                                                            : 'Download Invoice'}
                                                    </button>

                                                    <Link
                                                        to={`/support/ticket-delay/${booking._id}`}
                                                        className="group inline-flex items-center justify-center gap-2 w-full text-center bg-red-600 text-white border border-red-600 rounded-xl px-4 py-3 font-semibold hover:bg-red-700 hover:border-red-700 hover:shadow-md hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                                    >
                                                        <FaExclamationTriangle className="transition-transform duration-200 group-hover:scale-110" />

                                                        Ticket delayed? Contact support
                                                    </Link>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-sm text-gray-500 dark:text-gray-400 italic py-2">
                                            Booking Cancelled
                                        </div>
                                    )}
                                </div>
                            </article>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;