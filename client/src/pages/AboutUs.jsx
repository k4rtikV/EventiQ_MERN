import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    symbol: "01",
    title: "Simple Event Discovery",
    description:
      "Explore upcoming events, review complete event details, and choose experiences that match your interests.",
  },
  {
    symbol: "02",
    title: "Flexible Ticket Booking",
    description:
      "Book one or multiple tickets through a clear booking process designed for both free and paid events.",
  },
  {
    symbol: "03",
    title: "Secure Payments",
    description:
      "Complete paid registrations through the integrated payment process and access invoices from your account.",
  },
  {
    symbol: "04",
    title: "Digital Tickets",
    description:
      "Receive downloadable digital tickets with booking information, attendee quantity, and QR-based verification.",
  },
  {
    symbol: "05",
    title: "Real-Time Notifications",
    description:
      "Stay informed about booking requests, payments, approvals, tickets, cancellations, refunds, and support updates.",
  },
  {
    symbol: "06",
    title: "Support and Refund Tracking",
    description:
      "Raise ticket-delay or refund-delay requests and follow important status changes directly from your dashboard.",
  },
];

const values = [
  {
    title: "Clarity",
    description:
      "We present booking, payment, ticket, and refund statuses in a way that is easy to understand.",
  },
  {
    title: "Reliability",
    description:
      "EventiQ keeps users and administrators connected throughout the complete event-booking journey.",
  },
  {
    title: "Convenience",
    description:
      "Bookings, invoices, tickets, notifications, and support tools are brought together in one platform.",
  },
];

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-800 px-6 py-20 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide">
              About EventiQ
            </span>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Making event booking simpler, clearer, and more connected.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-indigo-100">
              EventiQ is a full-stack event booking platform that helps users
              discover events, complete registrations, manage tickets, receive
              updates, and access support from one convenient place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/events"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Explore Events
              </Link>

              <Link
                to="/faqs"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                View FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 transition-colors dark:bg-gray-950">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-400">
              Our purpose
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              One platform for the complete event journey
            </h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-gray-300">
              EventiQ was created to reduce the confusion often associated with
              online event registrations. Instead of separating bookings,
              payments, tickets, invoices, notifications, and support across
              different systems, the platform keeps them together.
            </p>

            <p className="mt-4 leading-8 text-slate-600 dark:text-gray-300">
              Users can follow the complete lifecycle of a booking, while
              administrators can manage requests, approve registrations,
              assign tickets, handle cancellations, initiate refunds, and
              respond to support concerns.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/20">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-950/60">
                <p className="text-3xl font-extrabold text-indigo-700">1</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-gray-100">
                  Unified booking platform
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 p-5 dark:bg-purple-950/60">
                <p className="text-3xl font-extrabold text-purple-700">24/7</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-gray-100">
                  Dashboard access
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/50">
                <p className="text-3xl font-extrabold text-emerald-700">QR</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-gray-100">
                  Digital ticket support
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/50">
                <p className="text-3xl font-extrabold text-amber-700">Live</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-gray-100">
                  Status notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 transition-colors dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-400">
              What EventiQ offers
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Designed around real booking needs
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-gray-300">
              Every major feature supports a specific stage of the event
              booking and management process.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:bg-white hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-500/60 dark:hover:bg-gray-800 dark:hover:shadow-black/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-purple-600 text-sm font-extrabold text-white shadow-md">
                  {feature.symbol}
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 transition-colors dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-slate-900 px-8 py-12 text-white ring-1 ring-white/5 sm:px-12 dark:bg-black">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-300">
                  Our mission
                </p>

                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Build confidence at every stage of a booking.
                </h2>
              </div>

              <p className="leading-8 text-slate-300">
                Our mission is to make event participation more transparent.
                Users should always know whether a payment was successful,
                whether a booking is awaiting approval, when a ticket has been
                assigned, and how a cancellation or refund is progressing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 transition-colors dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-400">
              Our values
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              What guides the platform
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {value.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600 dark:text-gray-300">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 transition-colors dark:bg-gray-950">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-indigo-700 to-purple-700 px-8 py-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold">
            Ready to discover your next event?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-indigo-100">
            Browse available events, complete your booking, and manage
            everything from your EventiQ account.
          </p>

          <Link
            to="/events"
            className="mt-7 inline-flex rounded-xl bg-white px-7 py-3 font-semibold text-indigo-800 transition hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Browse Events
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;