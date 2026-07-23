import React, {
    useEffect,
    useState
} from 'react';
import {
    useNavigate,
    useParams
} from 'react-router-dom';
import api from '../utils/axios';

const formatPrice = (amount) => {
    const value = Number(amount || 0);

    return new Intl.NumberFormat(
        'en-IN',
        {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(value);
};

const PaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        paymentLoading,
        setPaymentLoading
    ] = useState(false);

    const [promoLoading, setPromoLoading] =
        useState(false);

    const [promoCode, setPromoCode] =
        useState('');

    const [error, setError] =
        useState('');

    const [promoMessage, setPromoMessage] =
        useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } =
                    await api.get(
                        `/bookings/${id}`
                    );

                setBooking(data);

                setPromoCode(
                    data.promoCode || ''
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                        'Unable to load booking details'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const handlePromoCodeChange = (
        event
    ) => {
        const value =
            event.target.value.toUpperCase();

        setPromoCode(value);
        setError('');
        setPromoMessage('');
    };

    const handleApplyPromo = async () => {
        const normalizedCode =
            promoCode.trim().toUpperCase();

        if (!normalizedCode) {
            setError(
                'Please enter a promo code.'
            );
            return;
        }

        setPromoLoading(true);
        setError('');
        setPromoMessage('');

        try {
            const { data } =
                await api.post(
                    `/bookings/${id}/apply-promo`,
                    {
                        promoCode:
                            normalizedCode
                    }
                );

            setBooking(data.booking);

            setPromoCode(
                data.booking.promoCode ||
                    normalizedCode
            );

            setPromoMessage(
                data.message ||
                    'Promo code applied successfully.'
            );
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ||
                    'Unable to apply the promo code.'
            );

            if (
                requestError.response?.data
                    ?.booking
            ) {
                setBooking(
                    requestError.response.data
                        .booking
                );
            }
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = async () => {
        setPromoLoading(true);
        setError('');
        setPromoMessage('');

        try {
            const { data } =
                await api.delete(
                    `/bookings/${id}/promo`
                );

            setBooking(data.booking);
            setPromoCode('');

            setPromoMessage(
                data.message ||
                    'Promo code removed.'
            );
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ||
                    'Unable to remove the promo code.'
            );
        } finally {
            setPromoLoading(false);
        }
    };

    const handlePayment = async () => {
        setPaymentLoading(true);
        setError('');
        setPromoMessage('');

        try {
            const { data } =
                await api.post(
                    `/bookings/${id}/create-order`
                );

            if (data.free) {
                navigate(
                    '/payment-success'
                );
                return;
            }

            if (!window.Razorpay) {
                setError(
                    'Razorpay could not be loaded. Please refresh the page and try again.'
                );
                return;
            }

            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: 'EventiQ',
                description: `Payment for ${data.eventTitle}`,
                order_id: data.orderId,

                handler: async (
                    response
                ) => {
                    try {
                        await api.post(
                            `/bookings/${id}/verify-payment`,
                            {
                                razorpay_payment_id:
                                    response.razorpay_payment_id,
                                razorpay_order_id:
                                    response.razorpay_order_id,
                                razorpay_signature:
                                    response.razorpay_signature
                            }
                        );

                        navigate(
                            '/payment-success'
                        );
                    } catch (
                        verificationError
                    ) {
                        console.error(
                            verificationError
                        );

                        navigate(
                            '/payment-failed'
                        );
                    }
                },

                prefill: {
                    name:
                        booking.userId?.name ||
                        '',
                    email:
                        booking.userId?.email ||
                        '',
                    contact:
                        booking.address
                            ?.phone || ''
                },

                notes: {
                    bookingId: id
                },

                theme: {
                    color: '#111827'
                },

                modal: {
                    ondismiss: () => {
                        setPaymentLoading(
                            false
                        );
                    }
                }
            };

            const razorpay =
                new window.Razorpay(
                    options
                );

            razorpay.on(
                'payment.failed',
                () => {
                    navigate(
                        '/payment-failed'
                    );
                }
            );

            razorpay.open();
        } catch (requestError) {
            const responseData =
                requestError.response?.data;

            setError(
                responseData?.message ||
                    'Unable to initiate payment'
            );

            if (responseData?.booking) {
                setBooking(
                    responseData.booking
                );

                setPromoCode(
                    responseData.booking
                        .promoCode || ''
                );
            }
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold">
                Loading payment
                details...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-red-500">
                Booking not found.
            </div>
        );
    }

    const quantity = Number(booking.quantity || 1);
    const unitPrice = Number(booking.eventId?.ticketPrice || 0);

    const originalAmount = Number(
        booking.originalAmount ??
            booking.eventId?.ticketPrice ??
            booking.amount ??
            0
    );

    const discountAmount = Number(
        booking.discountAmount || 0
    );

    const finalAmount = Number(
        booking.amount ?? originalAmount
    );

    const hasPromo =
        Boolean(booking.promoCode) &&
        discountAmount > 0;

    const paymentButtonText =
        finalAmount === 0
            ? 'Complete Free Booking'
            : `Continue to Payment · ${formatPrice(
                  finalAmount
              )}`;

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mt-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Complete Your Payment
                </h1>

                <p className="text-gray-500 mt-2">
                    Apply a promo code and
                    continue securely with
                    Razorpay.
                </p>
            </div>

            <div className="grid gap-6 mb-6">
                <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
                    <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                        Event
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {booking.eventId
                            ?.title || 'Event'}
                    </h2>

                    {booking.eventId
                        ?.location && (
                        <p className="text-gray-600 mt-3">
                            {
                                booking.eventId
                                    .location
                            }
                        </p>
                    )}
                </div>

                <div className="rounded-3xl border border-gray-200 p-6 bg-white">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <p className="text-sm uppercase tracking-wider text-gray-500">
                                Promo code
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Enter the code
                                received from the
                                EventiQ newsletter.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={
                                handlePromoCodeChange
                            }
                            disabled={
                                promoLoading ||
                                hasPromo ||
                                booking.paymentStatus ===
                                    'paid'
                            }
                            maxLength={40}
                            placeholder="Enter promo code"
                            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold uppercase tracking-wide outline-none transition focus:border-gray-700 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
                        />

                        {hasPromo ? (
                            <button
                                type="button"
                                onClick={
                                    handleRemovePromo
                                }
                                disabled={
                                    promoLoading
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {promoLoading
                                    ? 'Removing...'
                                    : 'Remove'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={
                                    handleApplyPromo
                                }
                                disabled={
                                    promoLoading ||
                                    booking.paymentStatus ===
                                        'paid'
                                }
                                className="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {promoLoading
                                    ? 'Applying...'
                                    : 'Apply'}
                            </button>
                        )}
                    </div>

                    {hasPromo && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            Promo code{' '}
                            <strong>
                                {
                                    booking.promoCode
                                }
                            </strong>{' '}
                            is applied.
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-gray-200 p-6 bg-white">
                    <p className="text-sm uppercase tracking-wider text-gray-500 mb-4">
                        Payment summary
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 text-gray-700">
                            <span>Ticket price</span>
                            <span className="font-semibold text-gray-900">{formatPrice(unitPrice)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-gray-700">
                            <span>Quantity</span>
                            <span className="font-semibold text-gray-900">{quantity}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-gray-700">
                            <span>Subtotal</span>
                            <span className="font-semibold text-gray-900">{formatPrice(originalAmount)}</span>
                        </div>

                        {discountAmount >
                            0 && (
                            <div className="flex items-center justify-between gap-4 text-green-700">
                                <span>
                                    Newsletter
                                    discount
                                </span>

                                <span className="font-semibold">
                                    -
                                    {formatPrice(
                                        discountAmount
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-4 flex items-center justify-between gap-4">
                            <span className="text-lg font-bold text-gray-900">
                                Total payable
                            </span>

                            <span className="text-3xl font-black text-gray-900">
                                {finalAmount ===
                                0
                                    ? 'Free'
                                    : formatPrice(
                                          finalAmount
                                      )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {promoMessage && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-5 border border-green-100">
                    {promoMessage}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-5 border border-red-100">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handlePayment}
                disabled={
                    paymentLoading ||
                    promoLoading ||
                    booking.paymentStatus ===
                        'paid'
                }
                className="w-full bg-gray-900 text-white rounded-2xl py-4 px-4 text-lg font-bold hover:bg-black transition disabled:cursor-not-allowed disabled:opacity-60"
            >
                {booking.paymentStatus ===
                'paid'
                    ? 'Payment Already Completed'
                    : paymentLoading
                      ? 'Preparing payment...'
                      : paymentButtonText}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
                The payable amount is
                verified by the EventiQ
                server before Razorpay is
                opened.
            </p>
        </div>
    );
};

export default PaymentPage;