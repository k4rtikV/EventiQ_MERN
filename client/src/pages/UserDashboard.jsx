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
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaDownload,
    FaExclamationTriangle,
    FaHeart,
    FaList,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaReceipt,
    FaTag,
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

const DASHBOARD_VIEWS = {
    BOOKINGS: 'bookings',
    PAYMENTS: 'payments'
};

const formatCurrency = (amount) => {
    const value = Number(amount || 0);

    return value === 0
        ? 'Free'
        : `₹${value.toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }
    );
};

const formatDateTime = (value) => {
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleString(
        'en-IN',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }
    );
};

const getBookingReference = (booking) =>
    `EQ-${String(booking?._id || '')
        .slice(-6)
        .toUpperCase()}`;

const capitalize = (value) => {
    if (!value) {
        return '';
    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);
};

const getPaymentMethodText = (payment) => {
    const details =
        payment.paymentDetails || {};

    const method = details.method;
    const card = details.card || {};

    if (
        method === 'card' ||
        method === 'emi'
    ) {
        return [
            card.network,
            capitalize(card.type),
            method === 'emi' ? 'EMI' : 'Card'
        ]
            .filter(Boolean)
            .join(' ') || 'Card';
    }

    if (method === 'upi') {
        return 'UPI';
    }

    if (method === 'netbanking') {
        return 'Net Banking';
    }

    if (method === 'wallet') {
        return 'Wallet';
    }

    if (method === 'free') {
        return 'Free Booking';
    }

    return method
        ? capitalize(method)
        : 'Online Payment';
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
        paymentHistory,
        setPaymentHistory
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        paymentHistoryLoading,
        setPaymentHistoryLoading
    ] = useState(true);

    const [
        activeView,
        setActiveView
    ] = useState(
        DASHBOARD_VIEWS.BOOKINGS
    );

    const [
        activeFilter,
        setActiveFilter
    ] = useState(FILTERS.ALL);

    const [
        downloadingInvoiceId,
        setDownloadingInvoiceId
    ] = useState(null);

    const [
        dashboardError,
        setDashboardError
    ] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadDashboard = async () => {
            await Promise.all([
                fetchBookings(),
                fetchPaymentHistory()
            ]);
        };

        loadDashboard();
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

            setDashboardError(
                error.response?.data?.message ||
                    'Unable to load your bookings.'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        try {
            const {
                data
            } = await api.get(
                '/bookings/my/payment-history'
            );

            setPaymentHistory(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                'Error fetching payment history',
                error
            );
        } finally {
            setPaymentHistoryLoading(false);
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

            await Promise.all([
                fetchBookings(),
                fetchPaymentHistory()
            ]);
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
                booking.paymentDetails?.paidAt ||
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

    const filteredBookings = useMemo(
        () =>
            bookings.filter(
                (booking) =>
                    bookingMatchesFilter(
                        booking,
                        activeFilter
                    )
            ),
        [bookings, activeFilter]
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

    const getCardStyle = (booking) => {
        if (booking.status === 'cancelled') {
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

        return 'border-yellow-300 bg-yellow-50 dark:border-yellow-900/70 dark:bg-yellow-950/30';
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
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
                    >
                        Explore Events
                    </Link>

                    <Link
                        to="/wishlist"
                        className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold py-2.5 px-5 rounded-lg hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
                    >
                        <FaHeart />
                        My Wishlist
                    </Link>
                </div>
            </section>

            {dashboardError && (
                <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 flex items-start gap-3">
                    <FaExclamationTriangle className="mt-1 shrink-0" />
                    <p>{dashboardError}</p>
                </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    type="button"
                    onClick={() =>
                        setActiveView(
                            DASHBOARD_VIEWS.BOOKINGS
                        )
                    }
                    className={`group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200 ${
                        activeView ===
                        DASHBOARD_VIEWS.BOOKINGS
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                >
                    <FaTicketAlt className="transition-transform group-hover:scale-110" />
                    My Bookings
                    <span className="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs">
                        {bookings.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveView(
                            DASHBOARD_VIEWS.PAYMENTS
                        )
                    }
                    className={`group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200 ${
                        activeView ===
                        DASHBOARD_VIEWS.PAYMENTS
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                >
                    <FaReceipt className="transition-transform group-hover:scale-110" />
                    Payment History
                    <span className="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs">
                        {paymentHistory.length}
                    </span>
                </button>
            </div>

            {activeView ===
                DASHBOARD_VIEWS.BOOKINGS && (
                <BookingsSection
                    bookings={bookings}
                    filteredBookings={
                        filteredBookings
                    }
                    activeFilter={activeFilter}
                    setActiveFilter={
                        setActiveFilter
                    }
                    filterButtons={
                        filterButtons
                    }
                    filterCounts={filterCounts}
                    getCardStyle={getCardStyle}
                    cancelBooking={cancelBooking}
                    downloadInvoice={
                        downloadInvoice
                    }
                    downloadingInvoiceId={
                        downloadingInvoiceId
                    }
                />
            )}

            {activeView ===
                DASHBOARD_VIEWS.PAYMENTS && (
                <PaymentHistorySection
                    payments={paymentHistory}
                    loading={
                        paymentHistoryLoading
                    }
                    downloadInvoice={
                        downloadInvoice
                    }
                    downloadingInvoiceId={
                        downloadingInvoiceId
                    }
                />
            )}
        </div>
    );
};

const BookingsSection = ({
    bookings,
    filteredBookings,
    activeFilter,
    setActiveFilter,
    filterButtons,
    filterCounts,
    getCardStyle,
    cancelBooking,
    downloadInvoice,
    downloadingInvoiceId
}) => (
    <section>
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <FaTicketAlt />
                My Booking Requests
            </h2>
        </div>

        {bookings.length > 0 && (
            <div className="mb-7">
                <div className="flex flex-wrap gap-2.5">
                    {filterButtons.map(
                        ({
                            value,
                            label,
                            icon: Icon
                        }) => {
                            const isActive =
                                activeFilter === value;

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        setActiveFilter(
                                            value
                                        )
                                    }
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gray-900 dark:bg-blue-600 border-gray-900 dark:border-blue-600 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                >
                                    <Icon />
                                    {label}
                                    <span className="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs">
                                        {filterCounts[value]}
                                    </span>
                                </button>
                            );
                        }
                    )}
                </div>

                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Showing{' '}
                    <strong className="text-gray-700 dark:text-gray-200">
                        {filteredBookings.length}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-gray-700 dark:text-gray-200">
                        {bookings.length}
                    </strong>{' '}
                    bookings
                </p>
            </div>
        )}

        {bookings.length === 0 ? (
            <EmptyBookings />
        ) : filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
                <FaCheckCircle className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    No bookings in this category
                </h3>
                <button
                    type="button"
                    onClick={() =>
                        setActiveFilter(FILTERS.ALL)
                    }
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
                >
                    Show all bookings
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map(
                    (booking) => (
                        <BookingCard
                            key={booking._id}
                            booking={booking}
                            cardStyle={getCardStyle(
                                booking
                            )}
                            cancelBooking={
                                cancelBooking
                            }
                            downloadInvoice={
                                downloadInvoice
                            }
                            downloadingInvoiceId={
                                downloadingInvoiceId
                            }
                        />
                    )
                )}
            </div>
        )}
    </section>
);

const BookingCard = ({
    booking,
    cardStyle,
    cancelBooking,
    downloadInvoice,
    downloadingInvoiceId
}) => {
    const event = booking.eventId;
    const isPaid =
        booking.paymentStatus === 'paid';
    const isConfirmed =
        booking.status === 'confirmed';
    const isPending =
        booking.status === 'pending';
    const isCancelled =
        booking.status === 'cancelled';

    return (
        <article
            className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col border ${cardStyle}`}
        >
            <div className="p-6 border-b border-gray-200/70 dark:border-gray-700/70 flex-grow">
                {event ? (
                    <>
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                {event.title}
                            </h3>

                            <div className="flex flex-col gap-1 items-end shrink-0">
                                <span
                                    className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                        isConfirmed
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                            : isCancelled
                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300'
                                    }`}
                                >
                                    {booking.status}
                                </span>

                                {!isCancelled && (
                                    <span
                                        className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                            isPaid
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

                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                            <p>
                                <strong className="text-gray-700 dark:text-gray-200">
                                    Date:
                                </strong>{' '}
                                {formatDate(event.date)}
                            </p>
                            <p>
                                <strong className="text-gray-700 dark:text-gray-200">
                                    Amount:
                                </strong>{' '}
                                {formatCurrency(
                                    booking.amount
                                )}
                            </p>
                            <p>
                                <strong className="text-gray-700 dark:text-gray-200">
                                    Requested:
                                </strong>{' '}
                                {formatDate(
                                    booking.bookedAt ||
                                        booking.createdAt
                                )}
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-red-500 dark:text-red-400 italic">
                        Event details unavailable
                    </p>
                )}
            </div>

            <div className="p-4 bg-white/60 dark:bg-gray-900/50 flex flex-col gap-3 shrink-0">
                {!isCancelled && event && (
                    <div className="flex items-center justify-between gap-3">
                        <Link
                            to={`/booking/${booking._id}/purchased`}
                            className="text-gray-900 dark:text-gray-100 font-semibold text-sm hover:text-blue-600 hover:underline"
                        >
                            Booking Details
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
                )}

                {isConfirmed && isPaid && (
                    <Link
                        to={`/ticket/${booking._id}`}
                        className="group inline-flex items-center justify-center gap-2 w-full bg-gray-900 dark:bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                    >
                        <FaTicketAlt className="transition-transform group-hover:scale-110" />
                        View Ticket
                    </Link>
                )}

                {isPending && !isPaid && (
                    <Link
                        to={`/booking/${booking._id}/address`}
                        className="inline-flex justify-center w-full bg-yellow-500 text-white rounded-xl px-4 py-3 font-semibold hover:bg-yellow-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                    >
                        Continue to Payment
                    </Link>
                )}

                {isPending && isPaid && (
                    <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center gap-2 w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl px-4 py-3 font-semibold cursor-not-allowed"
                    >
                        <FaClock />
                        Ticket pending approval
                    </button>
                )}

                {isPaid && !isCancelled && (
                    <InvoiceButton
                        booking={booking}
                        downloadInvoice={
                            downloadInvoice
                        }
                        downloadingInvoiceId={
                            downloadingInvoiceId
                        }
                    />
                )}

                {isPending && isPaid && (
                    <Link
                        to={`/support/ticket-delay/${booking._id}`}
                        className="group inline-flex items-center justify-center gap-2 w-full bg-red-600 text-white border border-red-600 rounded-xl px-4 py-3 font-semibold hover:bg-red-700 hover:border-red-700 hover:shadow-md hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                    >
                        <FaExclamationTriangle className="transition-transform group-hover:scale-110" />
                        Ticket delayed? Contact support
                    </Link>
                )}

                {isCancelled && (
                    <div className="w-full text-center text-sm text-gray-500 dark:text-gray-400 italic py-2">
                        Booking Cancelled
                    </div>
                )}
            </div>
        </article>
    );
};

const PaymentHistorySection = ({
    payments,
    loading,
    downloadInvoice,
    downloadingInvoiceId
}) => (
    <section>
        <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <FaReceipt />
                Payment History
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                Review successful payments, card details,
                discounts and invoices.
            </p>
        </div>

        {loading ? (
            <div className="text-center py-16 text-gray-600 dark:text-gray-300 font-semibold">
                Loading payment history...
            </div>
        ) : payments.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                <FaReceipt className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    No successful payments yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Your completed payments will appear here.
                </p>
            </div>
        ) : (
            <div className="space-y-6">
                {payments.map((payment) => (
                    <PaymentHistoryCard
                        key={payment._id}
                        payment={payment}
                        downloadInvoice={
                            downloadInvoice
                        }
                        downloadingInvoiceId={
                            downloadingInvoiceId
                        }
                    />
                ))}
            </div>
        )}
    </section>
);

const PaymentHistoryCard = ({
    payment,
    downloadInvoice,
    downloadingInvoiceId
}) => {
    const event = payment.eventId || {};
    const details =
        payment.paymentDetails || {};
    const card = details.card || {};
    const hasDiscount =
        Number(payment.discountAmount || 0) > 0;
    const isCard =
        details.method === 'card' ||
        details.method === 'emi';
    const ticketReady =
        payment.status === 'confirmed';
    const ticketPending =
        payment.status === 'pending';
    const cancelled =
        payment.status === 'cancelled';

    return (
        <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
                            Successful Payment
                        </p>
                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {event.title ||
                                'Event unavailable'}
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Paid on{' '}
                            {formatDateTime(
                                details.paidAt ||
                                    payment.updatedAt ||
                                    payment.createdAt
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-black uppercase tracking-wide">
                            <FaCheckCircle />
                            Successful
                        </span>

                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase">
                            {getBookingReference(
                                payment
                            )}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-5">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <FaCreditCard className="text-blue-600" />
                            Payment Details
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoItem
                                label="Payment Method"
                                value={getPaymentMethodText(
                                    payment
                                )}
                            />

                            {isCard && (
                                <InfoItem
                                    label="Card"
                                    value={`•••• •••• •••• ${
                                        card.last4 ||
                                        '----'
                                    }`}
                                />
                            )}

                            {isCard && (
                                <InfoItem
                                    label="Issuer"
                                    value={
                                        card.issuer ||
                                        'Not available'
                                    }
                                />
                            )}

                            {details.method ===
                                'upi' && (
                                <InfoItem
                                    label="UPI ID"
                                    value={
                                        details.upi
                                            ?.vpa ||
                                        'Not available'
                                    }
                                />
                            )}

                            <InfoItem
                                label="Payment ID"
                                value={
                                    payment.razorpayPaymentId ||
                                    'Not applicable'
                                }
                                breakText
                            />

                            <InfoItem
                                label="Booking Reference"
                                value={getBookingReference(
                                    payment
                                )}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-5">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <FaMoneyBillWave className="text-green-600" />
                            Transaction Summary
                        </h4>

                        <div className="space-y-3 text-sm">
                            {hasDiscount && (
                                <SummaryRow
                                    label="Original Amount"
                                    value={formatCurrency(
                                        payment.originalAmount
                                    )}
                                />
                            )}

                            {hasDiscount && (
                                <SummaryRow
                                    label="Discount"
                                    value={`-${formatCurrency(
                                        payment.discountAmount
                                    )}`}
                                    valueClass="text-green-600 dark:text-green-400"
                                />
                            )}

                            {hasDiscount &&
                                payment.promoCode && (
                                <SummaryRow
                                    label="Promo Code"
                                    value={
                                        payment.promoCode
                                    }
                                    icon={<FaTag />}
                                />
                            )}

                            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-4 mt-4">
                                <SummaryRow
                                    label="Amount Paid"
                                    value={formatCurrency(
                                        payment.amount
                                    )}
                                    strong
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
                    <InfoItem
                        icon={<FaCalendarAlt />}
                        label="Event Date"
                        value={formatDate(
                            event.date
                        )}
                    />
                    <InfoItem
                        icon={<FaMapMarkerAlt />}
                        label="Venue"
                        value={
                            event.location ||
                            'Not available'
                        }
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-200 dark:border-gray-800">
                    {ticketReady && (
                        <Link
                            to={`/ticket/${payment._id}`}
                            className="group inline-flex items-center justify-center gap-2 flex-1 bg-gray-900 dark:bg-blue-600 text-white rounded-xl px-5 py-3 font-semibold hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                        >
                            <FaTicketAlt className="transition-transform group-hover:scale-110" />
                            View Ticket
                        </Link>
                    )}

                    {ticketPending && (
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center gap-2 flex-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-xl px-5 py-3 font-semibold cursor-not-allowed"
                        >
                            <FaClock />
                            Ticket Pending
                        </button>
                    )}

                    {cancelled && (
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center gap-2 flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3 font-semibold cursor-not-allowed"
                        >
                            <FaTimesCircle />
                            Booking Cancelled
                        </button>
                    )}

                    <InvoiceButton
                        booking={payment}
                        downloadInvoice={
                            downloadInvoice
                        }
                        downloadingInvoiceId={
                            downloadingInvoiceId
                        }
                        className="flex-1"
                    />
                </div>
            </div>
        </article>
    );
};

const InvoiceButton = ({
    booking,
    downloadInvoice,
    downloadingInvoiceId,
    className = ''
}) => {
    const downloading =
        downloadingInvoiceId === booking._id;

    return (
        <button
            type="button"
            disabled={downloading}
            onClick={() =>
                downloadInvoice(booking)
            }
            className={`group inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-xl px-5 py-3 font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${className}`}
        >
            {downloading ? (
                <>
                    <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                    Downloading...
                </>
            ) : (
                <>
                    <FaDownload className="transition-transform group-hover:translate-y-0.5" />
                    Download Invoice
                </>
            )}
        </button>
    );
};

const InfoItem = ({
    label,
    value,
    icon,
    breakText = false
}) => (
    <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            {icon}
            {label}
        </p>
        <p
            className={`mt-1 font-semibold text-gray-900 dark:text-white ${
                breakText ? 'break-all' : ''
            }`}
        >
            {value}
        </p>
    </div>
);

const SummaryRow = ({
    label,
    value,
    valueClass = '',
    strong = false,
    icon
}) => (
    <div className="flex items-center justify-between gap-4">
        <span
            className={`flex items-center gap-2 text-gray-500 dark:text-gray-400 ${
                strong ? 'font-bold' : ''
            }`}
        >
            {icon}
            {label}
        </span>
        <span
            className={`text-right text-gray-900 dark:text-white ${
                strong
                    ? 'text-lg font-black'
                    : 'font-semibold'
            } ${valueClass}`}
        >
            {value}
        </span>
    </div>
);

const EmptyBookings = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTicketAlt className="text-gray-300 dark:text-gray-600 text-3xl" />
        </div>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 mt-4 font-medium">
            You haven't booked any events yet.
        </p>
        <Link
            to="/events"
            className="inline-block bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
        >
            Browse Events
        </Link>
    </div>
);

export default UserDashboard;
