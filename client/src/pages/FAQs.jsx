import React from 'react';

const FAQs = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold mb-2">How do I book an event?</h2>
                    <p className="text-gray-700 leading-8">
                        Browse the event listings, select an event, enter your details, and complete the payment process. You’ll receive confirmation via email.
                    </p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Can I cancel my booking?</h2>
                    <p className="text-gray-700 leading-8">
                        Cancellation policies depend on the event organizer. Please check the refund policy page and the event details for specific terms.
                    </p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">What payment methods are accepted?</h2>
                    <p className="text-gray-700 leading-8">
                        We currently support Razorpay for secure online payments. More payment methods may be added in the future.
                    </p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">How do I get support?</h2>
                    <p className="text-gray-700 leading-8">
                        Visit the Contact Us page to send us a message, and our support team will respond as soon as possible.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FAQs;
