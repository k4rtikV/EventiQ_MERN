import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useSearchParams
} from 'react-router-dom';

import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

import {
    FaCalendarAlt,
    FaHeart,
    FaMapMarkerAlt,
    FaRegHeart,
    FaSearch
} from 'react-icons/fa';

const EventsPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] =
        useSearchParams();

    const [events, setEvents] = useState([]);
    const [wishlistIds, setWishlistIds] = useState(
        new Set()
    );

    const [wishlistLoadingId, setWishlistLoadingId] =
        useState(null);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] =
        useState(
            searchParams.get('category')?.trim() ||
                'All'
        );

    const [sortOption, setSortOption] =
        useState('default');

    const [loading, setLoading] = useState(true);
    const [wishlistMessage, setWishlistMessage] =
        useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlistIds(new Set());
        }
    }, [user]);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            const response = await api.get('/events');

            setEvents(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error(
                'Event request failed:',
                error
            );

            console.error(
                'Status:',
                error.response?.status
            );

            console.error(
                'Response:',
                error.response?.data
            );

            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');

            const wishlistEvents = Array.isArray(data)
                ? data
                : [];

            setWishlistIds(
                new Set(
                    wishlistEvents.map(
                        (event) => event._id
                    )
                )
            );
        } catch (error) {
            console.error(
                'Error fetching wishlist:',
                error
            );

            if (error.response?.status !== 401) {
                setWishlistMessage(
                    'Could not load your wishlist.'
                );
            }
        }
    };

    const showTemporaryMessage = (message) => {
        setWishlistMessage(message);

        window.setTimeout(() => {
            setWishlistMessage('');
        }, 2500);
    };

    const toggleWishlist = async (eventId) => {
        if (!user) {
            navigate('/login', {
                state: {
                    message:
                        'Please log in to save events to your wishlist.',
                    from: '/events'
                }
            });

            return;
        }

        if (wishlistLoadingId) {
            return;
        }

        const isWishlisted =
            wishlistIds.has(eventId);

        try {
            setWishlistLoadingId(eventId);

            if (isWishlisted) {
                await api.delete(
                    `/wishlist/${eventId}`
                );

                setWishlistIds((currentIds) => {
                    const updatedIds = new Set(
                        currentIds
                    );

                    updatedIds.delete(eventId);

                    return updatedIds;
                });

                showTemporaryMessage(
                    'Event removed from your wishlist.'
                );
            } else {
                await api.post(
                    `/wishlist/${eventId}`
                );

                setWishlistIds((currentIds) => {
                    const updatedIds = new Set(
                        currentIds
                    );

                    updatedIds.add(eventId);

                    return updatedIds;
                });

                showTemporaryMessage(
                    'Event added to your wishlist.'
                );
            }
        } catch (error) {
            console.error(
                'Wishlist update failed:',
                error
            );

            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }

            showTemporaryMessage(
                error.response?.data?.message ||
                    'Could not update your wishlist.'
            );
        } finally {
            setWishlistLoadingId(null);
        }
    };

    const categories = useMemo(() => {
        const eventCategories = events
            .map((event) =>
                event.category?.trim()
            )
            .filter(Boolean);

        return [
            'All',
            ...Array.from(
                new Set(eventCategories)
            ).sort(
                (
                    firstCategory,
                    secondCategory
                ) =>
                    firstCategory.localeCompare(
                        secondCategory
                    )
            )
        ];
    }, [events]);

    useEffect(() => {
        const requestedCategory =
            searchParams.get('category')?.trim();

        if (!requestedCategory) {
            setSelectedCategory('All');
            return;
        }

        const matchingCategory = categories.find(
            (category) =>
                category !== 'All' &&
                category.toLowerCase() ===
                    requestedCategory.toLowerCase()
        );

        if (matchingCategory) {
            setSelectedCategory(matchingCategory);
        }
    }, [categories, searchParams]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);

        const updatedParams = new URLSearchParams(
            searchParams
        );

        if (category === 'All') {
            updatedParams.delete('category');
        } else {
            updatedParams.set('category', category);
        }

        setSearchParams(updatedParams, {
            replace: true
        });
    };

    const filteredAndSortedEvents =
        useMemo(() => {
            const normalizedSearch = search
                .trim()
                .toLowerCase();

            const filteredEvents = events.filter(
                (event) => {
                    const title =
                        event.title?.toLowerCase() ||
                        '';

                    const location =
                        event.location?.toLowerCase() ||
                        '';

                    const category =
                        event.category?.toLowerCase() ||
                        '';

                    const matchesSearch =
                        normalizedSearch === '' ||
                        title.includes(
                            normalizedSearch
                        ) ||
                        location.includes(
                            normalizedSearch
                        ) ||
                        category.includes(
                            normalizedSearch
                        );

                    const matchesCategory =
                        selectedCategory === 'All' ||
                        event.category
                            ?.trim()
                            .toLowerCase() ===
                            selectedCategory.toLowerCase();

                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );

            const sortedEvents = [
                ...filteredEvents
            ];

            if (
                sortOption ===
                'price-low-to-high'
            ) {
                sortedEvents.sort(
                    (
                        firstEvent,
                        secondEvent
                    ) =>
                        Number(
                            firstEvent.ticketPrice ||
                                0
                        ) -
                        Number(
                            secondEvent.ticketPrice ||
                                0
                        )
                );
            }

            if (
                sortOption ===
                'price-high-to-low'
            ) {
                sortedEvents.sort(
                    (
                        firstEvent,
                        secondEvent
                    ) =>
                        Number(
                            secondEvent.ticketPrice ||
                                0
                        ) -
                        Number(
                            firstEvent.ticketPrice ||
                                0
                        )
                );
            }

            return sortedEvents;
        }, [
            events,
            search,
            selectedCategory,
            sortOption
        ]);

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('All');
        setSortOption('default');

        const updatedParams = new URLSearchParams(
            searchParams
        );
        updatedParams.delete('category');

        setSearchParams(updatedParams, {
            replace: true
        });
    };

    const filtersAreActive =
        search.trim() !== '' ||
        selectedCategory !== 'All' ||
        sortOption !== 'default';

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <section className="relative bg-gray-900 text-white rounded-3xl overflow-hidden mb-10 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-gray-800" />

                <div className="relative z-10 px-8 py-12 md:px-14 md:py-16">
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-3">
                        Discover EventiQ
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black mb-4">
                        Explore All Events
                    </h1>

                    <p className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed">
                        Browse conferences, concerts,
                        workshops, competitions and other
                        experiences available on EventiQ.
                    </p>
                </div>
            </section>

            {wishlistMessage && (
                <div
                    role="status"
                    className="fixed top-24 right-4 z-50 max-w-sm bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl font-medium"
                >
                    {wishlistMessage}
                </div>
            )}

            {/* Search and Filters */}
            <section className="mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative flex items-center group md:col-span-2">
                        <FaSearch className="absolute left-5 text-gray-400 group-focus-within:text-gray-900 transition-colors pointer-events-none" />

                        <input
                            type="text"
                            placeholder="Search by title, location or category..."
                            className="w-full pl-14 pr-5 py-4 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="category-filter"
                            className="sr-only"
                        >
                            Filter by category
                        </label>

                        <select
                            id="category-filter"
                            value={selectedCategory}
                            onChange={(event) =>
                                handleCategoryChange(
                                    event.target.value
                                )
                            }
                            className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        >
                            {categories.map(
                                (category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category ===
                                        'All'
                                            ? 'Any Category'
                                            : category}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="price-sort"
                            className="sr-only"
                        >
                            Sort events by price
                        </label>

                        <select
                            id="price-sort"
                            value={sortOption}
                            onChange={(event) =>
                                setSortOption(
                                    event.target.value
                                )
                            }
                            className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        >
                            <option value="default">
                                Sort By Price
                            </option>

                            <option value="price-low-to-high">
                                Price: Low to High
                            </option>

                            <option value="price-high-to-low">
                                Price: High to Low
                            </option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Results Header */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2 border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        All Events
                    </h2>

                    <p className="text-gray-500 font-medium mt-1">
                        {
                            filteredAndSortedEvents.length
                        }{' '}
                        {filteredAndSortedEvents.length ===
                        1
                            ? 'event found'
                            : 'events found'}
                    </p>
                </div>

                {filtersAreActive && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="self-start sm:self-auto px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition"
                    >
                        Clear Filters
                    </button>
                )}
            </section>

            {/* Event Results */}
            {loading ? (
                <div className="text-center py-20 text-xl font-semibold text-gray-600">
                    Loading events...
                </div>
            ) : filteredAndSortedEvents.length ===
              0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl text-center py-20 px-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        No events found
                    </h3>

                    <p className="text-gray-500 mb-6">
                        No events match your current
                        search or filters.
                    </p>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black transition"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAndSortedEvents.map(
                        (event) => {
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

                            const isWishlisted =
                                wishlistIds.has(
                                    event._id
                                );

                            const isUpdating =
                                wishlistLoadingId ===
                                event._id;

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
                                                toggleWishlist(
                                                    event._id
                                                )
                                            }
                                            disabled={
                                                isUpdating
                                            }
                                            aria-label={
                                                isWishlisted
                                                    ? `Remove ${event.title} from wishlist`
                                                    : `Add ${event.title} to wishlist`
                                            }
                                            title={
                                                isWishlisted
                                                    ? 'Remove from wishlist'
                                                    : 'Add to wishlist'
                                            }
                                            className={`absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-md backdrop-blur-sm ${
                                                isWishlisted
                                                    ? 'wishlist-heart-button-active'
                                                    : 'wishlist-heart-button'
                                            } ${
                                                isUpdating
                                                    ? 'cursor-wait opacity-60'
                                                    : 'cursor-pointer'
                                            }`}
                                        >
                                            {isWishlisted ? (
                                                <FaHeart className="text-lg" />
                                            ) : (
                                                <FaRegHeart className="text-lg" />
                                            )}
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
                                            {
                                                event.category
                                            }
                                        </div>

                                        <Link
                                            to={`/events/${event._id}`}
                                            className="hover:text-blue-600 transition"
                                        >
                                            <h2 className="text-xl font-bold text-gray-800 mb-3">
                                                {
                                                    event.title
                                                }
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

                                            <Link
                                                to={`/events/${event._id}`}
                                                className="block w-full text-center bg-gray-100 group-hover:bg-gray-900 group-hover:text-white text-gray-900 font-semibold py-2 rounded-lg transition"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsPage;