import React from 'react';
import { Link } from 'react-router-dom';
import { FiLock, FiShield } from 'react-icons/fi';

const sections = [
    ['1. Information we collect', 'EventiQ may collect account information such as your name, email address and authentication details; profile and booking information; attendee quantity and address details provided during booking; support messages; wishlist and notification activity; and technical information needed to operate, secure and improve the service.'],
    ['2. Payment information', 'Payments are processed through an integrated payment provider. EventiQ may store transaction references, payment status, amount and related booking information, but should not require or store your full card number, CVV, banking password or payment OTP.'],
    ['3. How information is used', 'Information is used to create and secure accounts, process bookings, generate invoices and tickets, send transactional emails and notifications, administer cancellations and refunds, answer support requests, prevent misuse and maintain the platform.'],
    ['4. Email and notifications', 'EventiQ may send operational messages relating to email verification, bookings, payments, ticket assignment, event changes, cancellations, refunds and support cases. Newsletter or promotional communication is handled separately and may use the information submitted through the newsletter form.'],
    ['5. Information sharing', 'Information may be shared with service providers involved in hosting, email delivery, payment processing, database operation or other platform functions. Information may also be disclosed where required by law, to protect users and the service, or in connection with suspected fraud or security incidents.'],
    ['6. Data retention', 'EventiQ may retain account, booking, payment, refund and support records for as long as reasonably necessary to provide the service, resolve disputes, maintain records, enforce policies and meet applicable obligations. Retention periods may differ by record type.'],
    ['7. Security', 'Reasonable technical and organisational safeguards are used to protect information. However, no internet service can guarantee absolute security. Users are responsible for keeping login credentials private and for reporting suspicious account activity promptly.'],
    ['8. Your choices', 'You may update available profile details through the platform and can contact support regarding account information or communication concerns. Some transactional records may need to be retained even after an account-related request.'],
    ['9. Cookies and local storage', 'EventiQ may use browser storage, cookies or similar technologies to keep you signed in, remember preferences such as theme settings, support core features and understand service operation. Browser settings can limit these technologies, but doing so may affect functionality.'],
    ['10. Third-party services and links', 'The platform may connect to payment, email or other third-party services and may contain external links. Those services operate under their own terms and privacy practices, which EventiQ does not control.'],
    ['11. Children’s privacy', 'EventiQ is not intended to knowingly collect personal information from children who cannot legally consent to the service in their jurisdiction. A parent or guardian should contact support if they believe such information has been provided.'],
    ['12. Policy changes', 'This Privacy Policy may be updated as the platform, legal requirements or service providers change. The latest version will be published on this page with an updated date.'],
    ['13. Contact', 'Questions or requests relating to this policy can be submitted through the Contact Us page. Include enough information for EventiQ to identify and respond to the request, but do not send passwords, CVV values or OTPs.']
];

const PrivacyPolicy = () => (
    <div className="mx-auto max-w-5xl space-y-8 text-gray-900 dark:text-gray-100">
        <section className="rounded-3xl bg-gray-900 px-7 py-11 text-white shadow-xl sm:px-10">
            <FiShield className="text-4xl" />
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-300">This policy describes the information EventiQ may collect, why it is used and the choices available to users.</p>
            <p className="mt-4 text-sm text-gray-400">Last updated: 27 July 2026</p>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex gap-4"><FiLock className="mt-1 shrink-0 text-2xl" /><p className="leading-7 text-gray-700 dark:text-gray-200">Do not send passwords, payment OTPs, CVV values or full card details through support forms, emails or chat messages.</p></div>
        </section>
        <section className="space-y-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-9">
            {sections.map(([title, text]) => <div key={title}><h2 className="text-2xl font-bold">{title}</h2><p className="mt-3 leading-8 text-gray-700 dark:text-gray-200">{text}</p></div>)}
        </section>
        <Link to="/contact-us" className="inline-flex rounded-2xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900">Contact Us</Link>
    </div>
);

export default PrivacyPolicy;
