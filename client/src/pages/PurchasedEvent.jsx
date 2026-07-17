import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave } from 'react-icons/fa';

const PurchasedEvent = () => {
    const { id } = useParams(); // booking id
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get(`/bookings/${id}`);
                // ensure only owner or admin can view
                if (!user) return navigate('/login');
                // compare against `user._id` which is returned from the auth API
                if (data.userId && data.userId._id && data.userId._id !== user._id && user.role !== 'admin') {
                    navigate('/dashboard');
                    return;
                }
                setBooking(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load booking');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id, user, navigate]);

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
    if (!booking || error) return <div className="text-center py-20 text-xl text-red-500">{error || 'Booking not found'}</div>;

    const event = booking.eventId || {};

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
            {event.image ? (
                <img src={event.image} alt={event.title} className="w-full h-80 object-cover" />
            ) : (
                <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                    {event.category}
                </div>
            )}

            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div>
                        <div className="inline-block bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                            {event.category}
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">{event.description}</p>
                        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: booking.status === 'pending' && booking.paymentStatus === 'not_paid' ? '#fff7ed' : '#f0fdf4', border: booking.status === 'pending' && booking.paymentStatus === 'not_paid' ? '1px solid #fcd34d' : '1px solid #d1fae5' }}>
                            {booking.status === 'pending' && booking.paymentStatus === 'not_paid' ? (
                                <>
                                    <p className="font-semibold text-yellow-700">Complete payment to book tickets.</p>
                                    <p className="text-sm text-gray-700">Booking status: <span className="font-bold text-gray-900">{booking.status}</span> — Payment: <span className="font-bold">{booking.paymentStatus.replace('_', ' ')}</span></p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-green-700">You already purchased tickets for this event.</p>
                                    <p className="text-sm text-gray-700">Booking status: <span className="font-bold text-gray-900">{booking.status}</span> — Payment: <span className="font-bold">{booking.paymentStatus.replace('_', ' ')}</span></p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Booking Details</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaMoneyBillWave />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Ticket Price</p>
                                    <p className="font-bold text-gray-800 text-lg">{event.ticketPrice === 0 ? <span className="text-green-500">Free</span> : `₹${event.ticketPrice}`}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaChair />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Availability</p>
                                    <p className="font-bold text-gray-800">{event.availableSeats} / {event.totalSeats}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Date</p>
                                    <p className="font-bold text-gray-800">{event.date ? new Date(event.date).toLocaleDateString() : ''}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Location</p>
                                    <p className="font-bold text-gray-800">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await api.post(`/bookings/${booking._id}/repurchase`);
                                        const newBooking = res.data.booking;
                                        // navigate directly to payment for the newly created booking
                                        navigate(`/booking/${newBooking._id}/payment`);
                                    } catch (err) {
                                        console.error(err);
                                        setError(err.response?.data?.message || 'Unable to start repurchase');
                                    }
                                }}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-xl text-center"
                            >
                                Book Again
                            </button>
                            <Link to={`/ticket/${booking._id}`} className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl text-center">View Ticket</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchasedEvent;
