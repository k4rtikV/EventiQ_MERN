import React from 'react';

const AboutUs = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <h1 className="text-4xl font-bold mb-6">About Us</h1>
            <p className="text-gray-700 leading-8 mb-4">
                EventiQ is a modern event booking platform built to make it easy for attendees to discover, book, and manage tickets for exciting events. We focus on delivering a seamless experience with secure payments, responsive customer support, and intuitive event discovery.
            </p>
            <p className="text-gray-700 leading-8 mb-4">
                Our mission is to bring experiences closer to people by helping creators and organizers promote events efficiently while giving users a reliable place to explore and book tickets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-3">What we offer</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Easy event search and booking</li>
                        <li>Secure payment flow</li>
                        <li>Personalized booking dashboard</li>
                        <li>Support for event organizers</li>
                    </ul>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-3">Why choose EventiQ</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>User-friendly experience</li>
                        <li>Transparent ticket handling</li>
                        <li>Reliable customer service</li>
                        <li>Modern, accessible interface</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
