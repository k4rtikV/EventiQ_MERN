import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const PaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get(`/bookings/${id}`);
                setBooking(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load booking details');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const handlePayment = async () => {
        setPaymentLoading(true);
        setError('');

        try {
            const { data } = await api.post(`/bookings/${id}/create-order`);

            if (data.free) {
                navigate('/payment-success');
                return;
            }

            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: 'EventiQ',
                description: `Payment for ${data.eventTitle}`,
                order_id: data.orderId,
                handler: async function (response) {
                    try {
                        await api.post(`/bookings/${id}/verify-payment`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        navigate('/payment-success');
                    } catch (err) {
                        console.error(err);
                        navigate('/payment-failed');
                    }
                },
                prefill: {
                    email: booking.userId?.email || '',
                    contact: booking.address?.phone || ''
                },
                theme: { color: '#111827' }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to initiate payment');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading payment details...</div>;
    if (!booking) return <div className="text-center py-20 text-xl font-semibold text-red-500">Booking not found.</div>;

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mt-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Payment</h1>
                <p className="text-gray-500 mt-2">Pay securely with Razorpay to confirm your booking.</p>
            </div>

            <div className="grid gap-6 mb-8">
                <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
                    <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Event</p>
                    <h2 className="text-2xl font-bold text-gray-900">{booking.eventId?.title || 'Event'}</h2>
                    <p className="text-gray-600 mt-3">{booking.eventId?.location || ''}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 p-6 bg-white">
                    <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Amount</p>
                    <div className="text-3xl font-black text-gray-900">{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

            <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full bg-gray-900 text-white rounded-2xl py-4 text-lg font-bold hover:bg-black transition"
            >
                {paymentLoading ? 'Preparing payment...' : 'Pay Now'}
            </button>
        </div>
    );
};

export default PaymentPage;
