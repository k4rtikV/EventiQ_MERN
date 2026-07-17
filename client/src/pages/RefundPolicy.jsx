import React from 'react';

const RefundPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <h1 className="text-4xl font-bold mb-6">Refund Policy</h1>
            <p className="text-gray-700 leading-8 mb-4">
                EventiQ aims to provide a transparent and fair refund process. Refund availability depends on the event organizer’s policy and the timing of your request.
            </p>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Refund Conditions</h2>
                    <p className="text-gray-700 leading-8">
                        Refunds are typically issued when an event is canceled or rescheduled by the organizer. For other cases, please review the event-specific terms or contact support.
                    </p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">How to request a refund</h2>
                    <p className="text-gray-700 leading-8">
                        Reach out through the Contact Us page with your booking details and reason for the refund. Our team will review the request and reply with next steps.
                    </p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Processing time</h2>
                    <p className="text-gray-700 leading-8">
                        Refunds may take 5-10 business days to process after approval, depending on your payment provider and bank.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
