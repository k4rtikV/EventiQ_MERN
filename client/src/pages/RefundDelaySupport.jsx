import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    FaArrowLeft,
    FaCheckCircle,
    FaDownload,
    FaExclamationTriangle,
    FaPaperPlane
} from 'react-icons/fa';

import {
    AuthContext
} from '../context/AuthContext';

import api from '../utils/axios';

const RefundDelaySupport = () => {
    const {
        bookingId
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
        message,
        setMessage
    ] = useState('');

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        submitting,
        setSubmitting
    ] = useState(false);

    const [
        downloadingInvoice,
        setDownloadingInvoice
    ] = useState(false);

    const [
        submitted,
        setSubmitted
    ] = useState(false);

    const [
        statusMessage,
        setStatusMessage
    ] = useState('');

    const invoiceNumber = useMemo(() => {
        if (!booking?._id) {
            return '';
        }

        const year = new Date(
            booking.bookedAt ||
            booking.createdAt
        ).getFullYear();

        return `INV-${year}-${booking._id
            .slice(-8)
            .toUpperCase()}`;
    }, [booking]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadBooking = async () => {
            try {
                const {
                    data
                } = await api.get(
                    `/bookings/${bookingId}`
                );

                if (
                    data.paymentStatus !== 'paid' ||
                    data.status !== 'cancelled' ||
                    data.refund?.status && data.refund.status !== 'not_started'
                ) {
                    setStatusMessage(
                        'Refund-delay support is available only for cancelled paid bookings that are still awaiting refund initiation.'
                    );

                    return;
                }

                setBooking(data);

                const generatedInvoiceNumber =
                    `INV-${new Date(
                        data.bookedAt ||
                        data.createdAt
                    ).getFullYear()}-${data._id
                        .slice(-8)
                        .toUpperCase()}`;

                setMessage(
`Hello EventiQ Support,

My paid booking for "${data.eventId?.title || 'my cancelled event'}" was cancelled, but the refund has not yet been initiated by the administrator.

Booking ID: ${data._id}
Payment ID: ${data.razorpayPaymentId || 'Free booking / not applicable'}
Invoice Number: ${generatedInvoiceNumber}
Amount Paid: INR ${Number(data.amount || 0).toFixed(2)}
Expected Refund Amount: INR ${Number(data.amount || 0).toFixed(2)}
Current Refund Status: Awaiting refund initiation

Please check the booking and help initiate the refund.

Thank you,
${user.name}`
                );
            } catch (error) {
                setStatusMessage(
                    error.response?.data?.message ||
                    'Unable to load this booking.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [
        bookingId,
        navigate,
        user
    ]);

    const downloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            setStatusMessage('');

            const response = await api.get(
                `/bookings/${bookingId}/invoice`,
                {
                    responseType: 'blob'
                }
            );

            const url =
                URL.createObjectURL(
                    response.data
                );

            const link =
                document.createElement('a');

            link.href = url;

            link.download =
                `${invoiceNumber ||
                'EventiQ-Invoice'}.pdf`;

            document.body.appendChild(link);

            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch (error) {
            setStatusMessage(
                error.response?.data?.message ||
                'Unable to download invoice.'
            );
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setStatusMessage('');

        try {
            const {
                data
            } = await api.post(
                `/support/refund-delay/${bookingId}`,
                {
                    message
                }
            );

            setSubmitted(true);
            setStatusMessage(data.message);
        } catch (error) {
            setStatusMessage(
                error.response?.data?.message ||
                'Unable to send your request.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Loading support details...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10">
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

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                        EventiQ Support
                    </p>

                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        Refund delay
                    </h1>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        Use this form when your paid booking has been cancelled but the administrator has not yet initiated the refund.
                    </p>

                    {booking && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-3 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Booking summary
                            </h2>

                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Event:</strong>{' '}
                                {booking.eventId?.title}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300 break-all">
                                <strong>Booking ID:</strong>{' '}
                                {booking._id}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300 break-all">
                                <strong>Payment ID:</strong>{' '}
                                {booking.razorpayPaymentId ||
                                    'Free booking / not applicable'}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Invoice:</strong>{' '}
                                {invoiceNumber}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Status:</strong>{' '}
                                Cancelled - Awaiting refund initiation
                            </p>

                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Expected refund amount:</strong>{' '}
                                INR {Number(booking.amount || 0).toFixed(2)}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Refund status:</strong>{' '}
                                Awaiting initiation
                            </p>

                            <button
                                type="button"
                                onClick={downloadInvoice}
                                disabled={
                                    downloadingInvoice
                                }
                                className="group inline-flex items-center justify-center gap-2 w-full mt-4 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 py-3 px-4 rounded-xl font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                <FaDownload className="transition-transform duration-200 group-hover:translate-y-0.5" />

                                {downloadingInvoice
                                    ? 'Downloading...'
                                    : 'Download Invoice'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-7">
                    {submitted ? (
                        <div className="text-center py-12">
                            <FaCheckCircle className="mx-auto text-5xl text-green-600 mb-4" />

                            <h2 className="text-2xl font-bold text-green-600 mb-3">
                                Request sent
                            </h2>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {statusMessage}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        '/dashboard'
                                    )
                                }
                                className="group inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                            >
                                <FaArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                                Return to dashboard
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                    Name
                                </label>

                                <input
                                    value={
                                        user?.name ||
                                        ''
                                    }
                                    readOnly
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                    Email
                                </label>

                                <input
                                    value={
                                        user?.email ||
                                        ''
                                    }
                                    readOnly
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                    Message
                                </label>

                                <textarea
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(
                                            event.target
                                                .value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    !booking
                                }
                                className="group inline-flex items-center justify-center gap-2 w-full bg-red-600 text-white border border-red-600 py-3 px-4 rounded-2xl font-semibold hover:bg-red-700 hover:border-red-700 hover:-translate-y-[2px] hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                {submitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Sending request...
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        Send refund initiation delay request with invoice
                                    </>
                                )}
                            </button>

                            {statusMessage && (
                                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm">
                                    <FaExclamationTriangle className="mt-0.5 shrink-0" />
                                    <p>
                                        {statusMessage}
                                    </p>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundDelaySupport;