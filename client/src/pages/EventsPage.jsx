import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSearch,
} from "react-icons/fa";

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [search]);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            const response = await api.get("/events", {
                params: {
                    search: search.trim(),
                },
            });

            setEvents(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error("Event request failed:", error);
            console.error("Status:", error.response?.status);
            console.error("Response:", error.response?.data);

            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

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
                        Browse conferences, concerts, workshops,
                        competitions and other experiences available
                        on EventiQ.
                    </p>
                </div>
            </section>

            {/* Search */}
            <section className="mb-10">
                <div className="w-full max-w-2xl relative flex items-center group">
                    <FaSearch className="absolute left-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />

                    <input
                        type="text"
                        placeholder="Search events by title..."
                        className="w-full pl-14 pr-5 py-4 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>
            </section>

            {/* Results Header */}
            <section className="flex items-center justify-between gap-4 mb-8 px-2 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-extrabold text-gray-900">
                    All Events
                </h2>

                <div className="text-gray-500 font-medium whitespace-nowrap">
                    {events.length}{" "}
                    {events.length === 1
                        ? "event found"
                        : "events found"}
                </div>
            </section>

            {/* Event Results */}
            {loading ? (
                <div className="text-center py-20 text-xl font-semibold text-gray-600">
                    Loading events...
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl text-center py-20 px-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        No events found
                    </h3>

                    <p className="text-gray-500">
                        No events match your current search.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => {
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

                        return (
                            <Link
                                key={event._id}
                                to={`/events/${event._id}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col no-underline text-inherit cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                            >
                                {/* Event Image */}
                                <div className="h-48 bg-gray-200 overflow-hidden relative">
                                    {event.image ? (
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-2xl">
                                            {event.category || "Event"}
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                        {event.ticketPrice === 0 ? (
                                            <span className="text-green-600">
                                                FREE
                                            </span>
                                        ) : (
                                            <span className="text-gray-900">
                                                ₹{event.ticketPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        {event.category}
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-800 mb-3">
                                        {event.title}
                                    </h2>

                                    <div className="flex flex-col gap-2 mb-4 text-gray-600 text-sm">
                                        <div className="flex items-start gap-2">
                                            <FaCalendarAlt className="text-gray-400 mt-1 flex-shrink-0" />

                                            <span>
                                                {new Date(
                                                    event.date
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: "long",
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    }
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                                            <span>{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                                            <div
                                                className="bg-gray-700 h-2 rounded-full"
                                                style={{
                                                    width: `${seatPercentage}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="text-xs text-gray-500 mb-4">
                                            {event.availableSeats} of{" "}
                                            {event.totalSeats} seats remaining
                                        </p>

                                        <div className="w-full text-center bg-gray-100 group-hover:bg-gray-900 group-hover:text-white text-gray-900 font-semibold py-2 rounded-lg transition">
                                            View Details
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EventsPage;