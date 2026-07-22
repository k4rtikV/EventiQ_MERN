import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const EVENT_CATEGORIES = [
    'Art',
    'Business',
    'Comedy',
    'Education',
    'Entertainment',
    'Food',
    'Gaming',
    'Music',
    'Sports',
    'Technology',
    'Other'
];

const hasMeaningfulText = (
    value,
    {
        minimumLetters = 3,
        minimumConsecutiveLetters = 3,
        maximumDigitRatio = 0.5
    } = {}
) => {
    const trimmedValue = String(value || '').trim();
    const letters = trimmedValue.match(/\p{L}/gu) || [];
    const digits = trimmedValue.match(/\d/g) || [];
    const alphanumericCount = letters.length + digits.length;
    const containsWordLikeText = new RegExp(
        `\\p{L}{${minimumConsecutiveLetters},}`,
        'u'
    ).test(trimmedValue);
    const digitRatio = alphanumericCount === 0
        ? 0
        : digits.length / alphanumericCount;
    const hasRepeatedGarbage = /(.)\1{4,}/u.test(trimmedValue);

    return (
        letters.length >= minimumLetters &&
        containsWordLikeText &&
        digitRatio <= maximumDigitRatio &&
        !hasRepeatedGarbage
    );
};

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

const getMinimumEventDateTime = () => {
    const minimumDate = new Date(Date.now() + 5 * 60 * 1000);
    minimumDate.setSeconds(0, 0);
    const offset = minimumDate.getTimezoneOffset() * 60000;

    return new Date(minimumDate.getTime() - offset)
        .toISOString()
        .slice(0, 16);
};

const validateEventForm = (formData) => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    const location = formData.location.trim();
    const image = formData.image.trim();
    const totalSeats = Number(formData.totalSeats);
    const ticketPrice = Number(formData.ticketPrice);
    const eventDate = new Date(formData.date);

    if (title.length < 3 || title.length > 100) {
        return 'Event title must be between 3 and 100 characters.';
    }

    if (!hasMeaningfulText(title, {
        minimumLetters: 3,
        minimumConsecutiveLetters: 2,
        maximumDigitRatio: 0.5
    })) {
        return 'Event title must contain a meaningful event name, not mostly numbers or random characters.';
    }

    if (!EVENT_CATEGORIES.includes(formData.category)) {
        return 'Please select a valid event category.';
    }

    if (!formData.date || Number.isNaN(eventDate.getTime())) {
        return 'Please select a valid event date and time.';
    }

    if (eventDate.getTime() <= Date.now() + 4 * 60 * 1000) {
        return 'Event date and time must be at least 5 minutes in the future.';
    }

    if (location.length < 2 || location.length > 150) {
        return 'Location must be between 2 and 150 characters.';
    }

    if (
        location.toLowerCase() !== 'online' &&
        !hasMeaningfulText(location, {
            minimumLetters: 3,
            minimumConsecutiveLetters: 3,
            maximumDigitRatio: 0.5
        })
    ) {
        return 'Please enter a meaningful venue, city, address, or Online.';
    }

    if (!Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 100000) {
        return 'Total seats must be a whole number between 1 and 100,000.';
    }

    if (
        formData.ticketPrice.trim() === '' ||
        !Number.isFinite(ticketPrice) ||
        ticketPrice < 0 ||
        ticketPrice > 1000000 ||
        !/^\d+(\.\d{1,2})?$/.test(formData.ticketPrice)
    ) {
        return 'Ticket price must be between ₹0 and ₹10,00,000 with no more than two decimal places.';
    }

    if (image && (image.length > 2048 || !isValidHttpUrl(image))) {
        return 'Please enter a valid HTTP or HTTPS image URL.';
    }

    if (description.length < 20 || description.length > 2000) {
        return 'Event description must be between 20 and 2,000 characters.';
    }

    if (!hasMeaningfulText(description, {
        minimumLetters: 10,
        minimumConsecutiveLetters: 3,
        maximumDigitRatio: 0.5
    })) {
        return 'Event description must contain meaningful text, not mostly numbers or random characters.';
    }

    return '';
};

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showEventForm, setShowEventForm] = useState(false);
    const [eventFormError, setEventFormError] = useState('');
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [eventsRes, bookingsRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/admin/all') // Admin gets all bookings
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setEventFormError('');

        const validationError = validateEventForm(formData);

        if (validationError) {
            setEventFormError(validationError);
            return;
        }

        const eventPayload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            date: formData.date,
            location: formData.location.trim(),
            category: formData.category,
            totalSeats: Number(formData.totalSeats),
            ticketPrice: Number(formData.ticketPrice),
            image: formData.image.trim()
        };

        try {
            setCreatingEvent(true);
            await api.post('/events', eventPayload);
            setShowEventForm(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                location: '',
                category: '',
                totalSeats: '',
                ticketPrice: '',
                image: ''
            });
            await fetchData();
        } catch (error) {
            setEventFormError(
                error.response?.data?.message ||
                'Unable to create the event. Please review the details and try again.'
            );
        } finally {
            setCreatingEvent(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                fetchData();
            } catch (error) {
                alert('Error deleting event');
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error confirming booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this user\'s booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading admin panel...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Manage events and manually confirm bookings.</p>
                </div>
                <button
                    onClick={() => {
                        setShowEventForm((current) => !current);
                        setEventFormError('');
                    }}
                    className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
                >
                    {showEventForm ? 'Cancel Creation' : '+ Create New Event'}
                </button>
            </div>

            {/* Admin Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button onClick={() => navigate('/successful-bookings')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-emerald-200 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-green-600">₹{bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-xl font-bold">₹</div>
                </button>
                <button onClick={() => navigate('/paid-clients')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-blue-700 hover:text-white hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Paid Clients</p>
                        <h3 className="text-3xl font-black text-blue-600">{new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">👤</div>
                </button>
                <button onClick={() => navigate('/pending-requests')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-yellow-300 hover:text-yellow-900 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-yellow-300">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-black text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl font-bold">⏳</div>
                </button>
            </div>

            {showEventForm && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animation-slideDown">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Event</h2>
                    {eventFormError && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {eventFormError}
                        </div>
                    )}

                    <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                        <div>
                            <label htmlFor="event-title" className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                            <input id="event-title" required type="text" minLength="3" maxLength="100" placeholder="e.g., Mumbai Tech Summit 2026" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div>
                            <label htmlFor="event-category" className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select id="event-category" required className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition bg-white" value={formData.category} onChange={(e) => { setFormData({ ...formData, category: e.target.value }); if (eventFormError) setEventFormError(''); }}>
                                <option value="">Select a category</option>
                                {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="event-date" className="block text-sm font-semibold text-gray-700 mb-2">Event Date and Time</label>
                            <input id="event-date" required type="datetime-local" min={getMinimumEventDateTime()} className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.date} onChange={(e) => { setFormData({ ...formData, date: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div>
                            <label htmlFor="event-location" className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                            <input id="event-location" required type="text" minLength="2" maxLength="150" placeholder="e.g., Jio World Convention Centre, Mumbai" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.location} onChange={(e) => { setFormData({ ...formData, location: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div>
                            <label htmlFor="event-seats" className="block text-sm font-semibold text-gray-700 mb-2">Total Seats</label>
                            <input id="event-seats" required type="number" min="1" max="100000" step="1" placeholder="e.g., 250" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.totalSeats} onChange={(e) => { setFormData({ ...formData, totalSeats: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div>
                            <label htmlFor="event-price" className="block text-sm font-semibold text-gray-700 mb-2">Ticket Price</label>
                            <input id="event-price" required type="number" min="0" max="1000000" step="0.01" placeholder="Enter 0 for a free event" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.ticketPrice} onChange={(e) => { setFormData({ ...formData, ticketPrice: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="event-image" className="block text-sm font-semibold text-gray-700 mb-2">Image URL <span className="font-normal text-gray-500">(optional)</span></label>
                            <input id="event-image" type="url" maxLength="2048" placeholder="https://example.com/event-image.jpg" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.image} onChange={(e) => { setFormData({ ...formData, image: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="event-description" className="block text-sm font-semibold text-gray-700 mb-2">Event Description</label>
                            <textarea id="event-description" required minLength="20" maxLength="2000" placeholder="Describe the event, schedule, highlights, and what attendees can expect." className="w-full border px-4 py-3 rounded-lg h-32 focus:ring-2 focus:ring-gray-700 outline-none transition resize-y" value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (eventFormError) setEventFormError(''); }} />
                            <p className="mt-1 text-xs text-gray-500 text-right">{formData.description.length}/2000</p>
                        </div>

                        <button type="submit" disabled={creatingEvent} className="md:col-span-2 bg-gray-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-black transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-gray-900">
                            {creatingEvent ? 'Publishing...' : 'Publish Event'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Events Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">{events.length}</span>
                        All Events
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {events.length === 0 ? <li className="p-6 text-gray-500 text-center">No events created yet.</li> :
                                events.map(event => (
                                    <li key={event._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">{event.title}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1 font-medium"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {new Date(event.date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 font-medium"><div className={`w-2 h-2 rounded-full ${event.availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div> {event.availableSeats}/{event.totalSeats} seats</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteEvent(event._id)} className="w-full sm:w-auto text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm shrink-0">
                                            Delete
                                        </button>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">{bookings.length}</span>
                        Booking Requests
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {bookings.length === 0 ? <li className="p-6 text-gray-500 text-center">No bookings yet.</li> :
                                bookings.map(booking => (
                                    <li key={booking._id} className={`p-6 hover:bg-gray-50 transition border-l-4 ${booking.status === 'pending' ? 'border-l-yellow-400' : booking.status === 'confirmed' ? 'border-l-green-400' : 'border-l-red-400'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.eventId?.title || 'Deleted Event'}</h4>
                                            <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                                <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span>
                                                {booking.status !== 'cancelled' && <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-800'}`}>{booking.paymentStatus.replace('_', ' ')}</span>}
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
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">Date:</span>
                                                <span>{new Date(booking.bookedAt).toLocaleString()}</span>
                                            </p>
                                            {booking.eventId && (
                                                <p className="text-gray-700 flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Seats:</span>
                                                    <span className={`font-bold ${booking.eventId.availableSeats > 0 ? 'text-green-600' : 'text-red-500'}`}>{booking.eventId.availableSeats}</span> remaining of {booking.eventId.totalSeats}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons for admin */}
                                        {booking.status === 'pending' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve as Paid
                                                </button>
                                                <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve Undecided
                                                </button>
                                                <button onClick={() => handleCancelBooking(booking._id)} className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg transition">
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;