import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';

const faqGroups = [
    {
        title: 'Bookings',
        items: [
            { q: 'How do I book an event?', a: 'Open an event, select the required ticket quantity, provide the requested booking details and continue through the available free-registration or payment flow. You can follow the resulting booking from your dashboard.' },
            { q: 'Can I book more than one ticket?', a: 'Yes. When quantity selection is available, one booking can admit multiple attendees. The generated ticket shows the total number of people admitted by that booking.' },
            { q: 'Can I book the same event again?', a: 'A completed paid booking does not permanently block another booking for the same event. Restrictions may still apply when an earlier booking is incomplete, unpaid or awaiting an action that prevents duplication.' },
            { q: 'What does pending approval mean?', a: 'Your request has been created but still needs administrator review. For paid events, payment completion and booking approval are separate stages.' },
            { q: 'Where can I see my booking status?', a: 'Open your user dashboard and view My Bookings. Important changes are also shown in the Notification Centre and may be sent by email.' }
        ]
    },
    {
        title: 'Payments and invoices',
        items: [
            { q: 'Which payments does EventiQ support?', a: 'Paid bookings use the payment options made available through the integrated payment gateway. The exact options displayed can depend on the gateway and its current test or live configuration.' },
            { q: 'Does successful payment guarantee ticket approval?', a: 'Successful payment confirms that the transaction was completed, but the booking may still require administrator review. Your dashboard will show whether it is awaiting approval or whether the ticket has been issued.' },
            { q: 'Where can I download my invoice?', a: 'When an invoice is available for a paid booking, use the View or Download Invoice option shown with the relevant booking or payment-history entry.' },
            { q: 'What should I do after a failed payment?', a: 'Confirm that no amount was deducted, then retry through the applicable booking flow. When an amount appears deducted but the booking was not updated, contact support with the booking and transaction details.' }
        ]
    },
    {
        title: 'Tickets and entry',
        items: [
            { q: 'When will I receive my ticket?', a: 'The ticket becomes available after the booking is approved and allotted. You may receive an email and notification when this happens, and the ticket can also be opened from your dashboard.' },
            { q: 'What information is on my ticket?', a: 'The ticket can include event information, attendee details, the booking reference, the admitted quantity and a QR code used for ticket verification.' },
            { q: 'What if my ticket is delayed?', a: 'For an eligible approved or paid booking, use the Ticket delayed? Contact support action. It opens a pre-filled request connected to the affected booking so the support team receives the relevant context.' },
            { q: 'Can I use a screenshot instead of the downloaded ticket?', a: 'Use the official ticket shown or downloaded from EventiQ whenever possible. The QR code and booking details must remain clear and readable, and entry is still subject to successful verification.' }
        ]
    },
    {
        title: 'Cancellations and refunds',
        items: [
            { q: 'Can I cancel a booking?', a: 'Cancellation availability depends on the booking status, event conditions and any applicable organizer rules. When cancellation is allowed, the action is displayed on the relevant booking.' },
            { q: 'What happens when I cancel an unpaid booking?', a: 'The booking is marked cancelled and no refund is required because no completed payment is attached to it.' },
            { q: 'What does awaiting refund initiation mean?', a: 'The paid booking has been cancelled, but an administrator has not yet recorded the refund as initiated. This status is different from the payment provider actually processing the refund.' },
            { q: 'What does refund initiated mean?', a: 'An administrator has started or recorded the refund process. The final credit time depends on the payment provider, bank and transaction method.' },
            { q: 'What if my refund is delayed?', a: 'Use the Refund delayed? Contact support action shown for an applicable cancelled paid booking. EventiQ will attach the booking information to your support request.' }
        ]
    },
    {
        title: 'Account, notifications and support',
        items: [
            { q: 'Why should I verify my email?', a: 'Email verification helps confirm account ownership and supports reliable delivery of booking, payment, ticket and support updates.' },
            { q: 'What appears in the Notification Centre?', a: 'Notifications may cover bookings, payments, ticket assignment, cancellations, refunds, event changes and support-request progress. Some items link directly to the related page.' },
            { q: 'How do I contact EventiQ support?', a: 'Use the Contact Us page for general help. For delayed tickets or refunds, use the booking-specific support buttons because they automatically include the correct booking context.' },
            { q: 'How do promo codes work?', a: 'Enter an eligible code during the supported booking or payment stage. When accepted, EventiQ displays the discount before you complete the transaction.' }
        ]
    }
];

const FAQs = () => {
    const [openItem, setOpenItem] = useState('Bookings-0');

    return (
        <div className="mx-auto max-w-5xl space-y-8 text-gray-900 dark:text-gray-100">
            <section className="rounded-3xl bg-gray-900 px-7 py-11 text-white shadow-xl sm:px-10">
                <FiHelpCircle className="text-4xl" />
                <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Frequently Asked Questions</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-300">
                    Find answers about EventiQ bookings, payments, digital tickets, cancellations, refunds, notifications and support.
                </p>
            </section>

            {faqGroups.map((group) => (
                <section key={group.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                    <h2 className="text-2xl font-bold">{group.title}</h2>
                    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:divide-gray-700">
                        {group.items.map((item, index) => {
                            const itemId = `${group.title}-${index}`;
                            const isOpen = openItem === itemId;
                            return (
                                <article key={item.q} className="bg-white dark:bg-gray-900">
                                    <button
                                        type="button"
                                        onClick={() => setOpenItem(isOpen ? '' : itemId)}
                                        aria-expanded={isOpen}
                                        className={`flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-bold transition-colors ${isOpen ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800'}`}
                                    >
                                        <span>{item.q}</span>
                                        <FiChevronDown className={`shrink-0 text-xl transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="bg-gray-50 px-5 pb-5 leading-8 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                            {item.a}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

            <section className="rounded-3xl bg-gray-100 p-7 text-center dark:bg-gray-800">
                <h2 className="text-2xl font-bold">Still need assistance?</h2>
                <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-700 dark:text-gray-200">
                    Contact the support team for account or booking-specific help. Include the relevant booking details whenever possible.
                </p>
                <Link to="/contact-us" className="mt-6 inline-flex rounded-2xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                    Contact Support
                </Link>
            </section>
        </div>
    );
};

export default FAQs;
