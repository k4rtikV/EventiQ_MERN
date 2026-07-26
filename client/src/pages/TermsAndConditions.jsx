import React from "react";
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiCalendar,
  FiClipboard,
} from "react-icons/fi";

const Section = ({ icon, title, children }) => (
  <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-colors dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-2xl text-blue-600 dark:text-blue-400">{icon}</div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
    </div>
    <div className="leading-7 text-gray-600 dark:text-gray-300">{children}</div>
  </div>
);

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-6">

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FiClipboard className="text-5xl text-blue-600 dark:text-blue-400" />
          </div>

          <h1 className="mb-3 text-4xl font-bold text-gray-800 dark:text-white">
            Terms & Conditions
          </h1>

          <p className="mx-auto max-w-3xl text-gray-600 dark:text-gray-300">
            Please read these Terms and Conditions carefully before using
            EventiQ. By creating an account or booking an event, you agree
            to comply with the policies outlined below.
          </p>
        </div>

        <Section
          icon={<FiUsers />}
          title="1. User Responsibilities"
        >
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide accurate personal information.</li>
            <li>Maintain the security of your account.</li>
            <li>Do not share your login credentials.</li>
            <li>Respect event organizers and platform policies.</li>
          </ul>
        </Section>

        <Section
          icon={<FiCheckCircle />}
          title="2. Event Bookings"
        >
          <ul className="list-disc ml-6 space-y-2">
            <li>Bookings are subject to organizer approval where applicable.</li>
            <li>Successful payment does not always mean immediate ticket issuance.</li>
            <li>Tickets are generated only after the booking has been approved.</li>
            <li>Users may book multiple tickets where permitted by the event.</li>
          </ul>
        </Section>

        <Section
          icon={<FiCalendar />}
          title="3. Event Changes"
        >
          <ul className="list-disc ml-6 space-y-2">
            <li>Organizers may change venue, date or timings.</li>
            <li>Users will receive notifications for significant updates.</li>
            <li>Cancelled events will follow the platform refund policy.</li>
          </ul>
        </Section>

        <Section
          icon={<FiShield />}
          title="4. Payments & Security"
        >
          <ul className="list-disc ml-6 space-y-2">
            <li>Payments are processed through secure payment providers.</li>
            <li>EventiQ never stores complete card information.</li>
            <li>Invoices are available for completed transactions.</li>
          </ul>
        </Section>

        <Section
          icon={<FiAlertCircle />}
          title="5. Prohibited Activities"
        >
          <ul className="list-disc ml-6 space-y-2">
            <li>Attempting unauthorized access.</li>
            <li>Using automated bots to abuse bookings.</li>
            <li>Uploading malicious content.</li>
            <li>Creating fraudulent bookings or payment records.</li>
          </ul>
        </Section>

        <Section
          icon={<FiClipboard />}
          title="6. Refunds"
        >
          <p>
            Refund eligibility depends on the event organizer's cancellation
            policy. Paid cancellations may enter an "Awaiting Refund
            Initiation" stage before being processed. Users can monitor refund
            status through their dashboard.
          </p>
        </Section>

        <Section
          icon={<FiShield />}
          title="7. Acceptance"
        >
          <p>
            Continued use of EventiQ indicates your acceptance of these
            Terms and Conditions. The platform reserves the right to modify
            these policies as new features are introduced.
          </p>
        </Section>

      </div>
    </div>
  );
};

export default TermsAndConditions;