import React, {
    useContext,
    useEffect,
    useState
} from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    FaCalendarAlt,
    FaHeart,
    FaMapMarkerAlt,
    FaTrash
} from 'react-icons/fa';

import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const WishlistPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] =
        useState(null);

    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchWishlist();
    }, [user, navigate]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);

            const { data } = await api.get(
                '/wishlist'
            );

            setWishlist(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                'Error fetching wishlist:',
                error
            );

            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }

            setMessage(
                error.response?.data?.message ||
                    'Could not load your wishlist.'
            );
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (
        eventId
    ) => {
        try {
            setRemovingId(eventId);

            await api.delete(
                `/wishlist/${eventId}`
            );

            setWishlist((currentWishlist) =>
                currentWishlist.filter(
                    (event) =>
                        event._id !== eventId
                )
            );

            setMessage(
                'Event removed from your wishlist.'
            );

            window.setTimeout(() => {
                setMessage('');
            }, 2500);
        } catch (error) {
            console.error(
                'Error removing wishlist event:',
                error
            );

            setMessage(
                error.response?.data?.message ||
                    'Could not remove this event.'
            );
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-gray-600">
                Loading your wishlist...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <section className="bg-gray-900 text-white rounded-3xl px-7 py-10 sm:px-10 sm:py-12 mb-10 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <FaHeart className="text-red-500 text-2xl" />

                            <p className="uppercase tracking-widest text-sm font-bold text-gray-300">
                                Saved events
                            </p>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black mb-3">
                            My Wishlist
                        </h1>

                        <p className="text-gray-300 max-w-2xl">
                            View and manage the events you
                            have saved for later.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="inline-flex justify-center bg-white text-gray-900 font-bold px-5 py-3 rounded-xl hover:bg-gray-100 transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </section>

            {message && (
                <div
                    role="status"
                    className="mb-6 rounded-xl bg-gray-900 text-white px-5 py-3 font-medium shadow-md"
                >
                    {message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7 border-b border-gray-200 pb-5">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">
                        Saved Events
                    </h2>

                    <p className="text-gray-500 mt-1">
                        {wishlist.length}{' '}
                        {wishlist.length === 1
                            ? 'event saved'
                            : 'events saved'}
                    </p>
                </div>

                <Link
                    to="/events"
                    className="inline-flex justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
                >
                    Explore More Events
                </Link>
            </div>

            {wishlist.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                        <FaHeart className="text-red-200 text-3xl" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Your wishlist is empty
                    </h2>

                    <p className="text-gray-500 max-w-md mx-auto mb-7">
                        Select the heart icon on an event
                        to save it here for later.
                    </p>

                    <Link
                        to="/events"
                        className="inline-flex bg-gray-900 hover:bg-black text-white font-bold px-7 py-3 rounded-xl transition"
                    >
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {wishlist.map((event) => {
                        const seatPercentage =
                            event.totalSeats > 0
                                ? Math.min(
                                      100,
                                      Math.max(
                                          0,
                                          (event.availableSeats /
                                              event.totalSeats) *
                                              100
                                      )
                                  )
                                : 0;

                        const isRemoving =
                            removingId === event._id;

                        return (
                            <article
                                key={event._id}
                                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                            >
                                <div className="h-48 bg-gray-200 overflow-hidden relative">
                                    <Link
                                        to={`/events/${event._id}`}
                                        className="block w-full h-full"
                                    >
                                        {event.image ? (
                                            <img
                                                src={
                                                    event.image
                                                }
                                                alt={
                                                    event.title
                                                }
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-2xl">
                                                {event.category ||
                                                    'Event'}
                                            </div>
                                        )}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeFromWishlist(
                                                event._id
                                            )
                                        }
                                        disabled={isRemoving}
                                        title="Remove from wishlist"
                                        aria-label={`Remove ${event.title} from wishlist`}
                                        className={`wishlist-heart-button-active absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-md ${
                                            isRemoving
                                                ? 'cursor-wait opacity-60'
                                                : 'cursor-pointer'
                                        }`}
                                    >
                                        <FaHeart className="text-lg" />
                                    </button>

                                    <div className="event-price-badge absolute top-4 right-4 z-10 rounded-full px-3 py-1.5 text-sm font-extrabold shadow-md backdrop-blur-sm">
                                        {Number(
                                            event.ticketPrice
                                        ) === 0 ? (
                                            <span className="event-price-badge-free">
                                                FREE
                                            </span>
                                        ) : (
                                            <span>
                                                ₹
                                                {Number(
                                                    event.ticketPrice
                                                ).toLocaleString(
                                                    'en-IN'
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        {event.category}
                                    </div>

                                    <Link
                                        to={`/events/${event._id}`}
                                        className="hover:text-blue-600 transition"
                                    >
                                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                                            {event.title}
                                        </h2>
                                    </Link>

                                    <div className="flex flex-col gap-2 mb-4 text-gray-600 text-sm">
                                        <div className="flex items-start gap-2">
                                            <FaCalendarAlt className="text-gray-400 mt-1 flex-shrink-0" />

                                            <span>
                                                {new Date(
                                                    event.date
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday:
                                                            'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />

                                            <span>
                                                {
                                                    event.location
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                                            <div
                                                className="bg-gray-700 h-2 rounded-full"
                                                style={{
                                                    width: `${seatPercentage}%`
                                                }}
                                            />
                                        </div>

                                        <p className="text-xs text-gray-500 mb-4">
                                            {
                                                event.availableSeats
                                            }{' '}
                                            of{' '}
                                            {
                                                event.totalSeats
                                            }{' '}
                                            seats remaining
                                        </p>

                                        <div className="grid grid-cols-[1fr_auto] gap-2">
                                            <Link
                                                to={`/events/${event._id}`}
                                                className="text-center bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-lg transition"
                                            >
                                                View Details
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeFromWishlist(
                                                        event._id
                                                    )
                                                }
                                                disabled={
                                                    isRemoving
                                                }
                                                title="Remove from wishlist"
                                                className="w-11 flex items-center justify-center border border-red-200 text-red-500 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition disabled:opacity-60"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;