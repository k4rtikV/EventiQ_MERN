import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCcw } from 'react-icons/fi';

const RefundPolicy = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <section className="rounded-3xl bg-gray-900 px-7 py-11 text-white shadow-xl sm:px-10">
                <FiRefreshCcw className="text-4xl" />
                <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Refund Policy</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-300">
                    This policy explains how cancellations and refunds are represented and handled through EventiQ. Event-specific conditions may also apply.
                </p>
                <p className="mt-4 text-sm text-gray-400">Last updated: 27 July 2026</p>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-gray-900"><FiCheckCircle className="text-3xl" /><h2 className="mt-4 text-xl font-bold">Eligibility review</h2><p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">Refund eligibility depends on payment completion, booking status, cancellation timing and event-specific rules.</p></div>
                <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-gray-900"><FiClock className="text-3xl" /><h2 className="mt-4 text-xl font-bold">Status visibility</h2><p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">Your dashboard distinguishes a refund awaiting initiation from one that has already been initiated.</p></div>
                <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-gray-900"><FiAlertCircle className="text-3xl" /><h2 className="mt-4 text-xl font-bold">Provider timelines</h2><p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">After initiation, the final credit time is controlled by the gateway, payment method and bank.</p></div>
            </section>

            <section className="rounded-3xl bg-white p-7 shadow-xl dark:bg-gray-900 sm:p-9 space-y-8">
                <div><h2 className="text-2xl font-bold">1. Scope of this policy</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">This policy applies to bookings made through EventiQ. An event listing or organizer may provide additional cancellation conditions. Where event-specific conditions are displayed, users should review them before booking.</p></div>
                <div><h2 className="text-2xl font-bold">2. User-initiated cancellation</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">A cancellation option is shown only when the booking is eligible under the current platform workflow. Cancelling an unpaid booking closes the request without creating a refund. Cancelling a paid booking records that the booking was previously paid and may create a refund action for administrator review.</p></div>
                <div><h2 className="text-2xl font-bold">3. Event cancellation or material change</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">When an organizer cancels an event or makes a material change, affected users may be notified. Refund handling will depend on the organizer’s decision, the booking status and the payment record. Users should retain their booking and payment details until the matter is resolved.</p></div>
                <div><h2 className="text-2xl font-bold">4. Refund status definitions</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700"><h3 className="font-bold">Awaiting refund initiation</h3><p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">The paid booking has been cancelled, but an administrator has not yet marked the refund as initiated.</p></div>
                        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700"><h3 className="font-bold">Refund initiated</h3><p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">The refund process has been started or recorded. It does not necessarily mean the amount has already reached the user’s account.</p></div>
                    </div>
                </div>
                <div><h2 className="text-2xl font-bold">5. Processing time</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">EventiQ aims to process eligible refund actions promptly. Once initiated, a refund commonly requires several business days to appear, but actual timelines vary by gateway, card network, UPI provider, bank and other payment partners. Weekends and public holidays may affect settlement time.</p></div>
                <div><h2 className="text-2xl font-bold">6. Cases that may not qualify</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">A refund may be unavailable when the booking is unpaid, the event has already taken place, the user did not attend, the request falls outside applicable event conditions, supplied information is inaccurate, or misuse, duplication or fraud is suspected. This list is not exhaustive.</p></div>
                <div><h2 className="text-2xl font-bold">7. Promo codes and discounts</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">Refund calculations are based on the amount actually paid after any applicable discount. Promotional benefits generally have no cash value and may not be restored after cancellation unless EventiQ expressly confirms otherwise.</p></div>
                <div><h2 className="text-2xl font-bold">8. Delayed refunds</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">When the Refund delayed? Contact support option appears for a cancelled paid booking, use it to submit a booking-linked request. Before contacting support, check the displayed refund status and allow the payment provider’s normal processing period.</p></div>
                <div><h2 className="text-2xl font-bold">9. Incorrect or duplicate transactions</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">Report suspected duplicate charges or an amount deducted without a corresponding booking update through support. Provide the booking reference, transaction reference, payment date and a concise description. Do not share full card numbers, CVV values, passwords or OTPs.</p></div>
                <div><h2 className="text-2xl font-bold">10. Contact</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">For refund assistance, use the booking-specific support action whenever available or visit the Contact Us page. Submission of a request does not itself guarantee refund eligibility.</p></div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/contact-us" className="rounded-2xl bg-gray-900 px-6 py-3 text-center font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900">Contact Support</Link>
                <Link to="/faqs" className="rounded-2xl border border-gray-300 px-6 py-3 text-center font-bold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">Read FAQs</Link>
            </div>
        </div>
    );
};

export default RefundPolicy;
