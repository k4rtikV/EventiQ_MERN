import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import EventsPage from './pages/EventsPage';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import AddressDetails from './pages/AddressDetails';
import PaymentPage from './pages/PaymentPage';
import AboutUs from './pages/AboutUs';
import FAQs from './pages/FAQs';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';
import TicketPage from './pages/TicketPage';
import PurchasedEvent from './pages/PurchasedEvent';
import SuccessfulBookings from './pages/SuccessfulBookings';
import PaidClients from './pages/PaidClients';
import PendingRequests from './pages/PendingRequests';

function App() {
    return (
        <Router>
            <ScrollToTop />

            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />

                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/booking/:id/address" element={<AddressDetails />} />
                        <Route path="/booking/:id/payment" element={<PaymentPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/successful-bookings" element={<SuccessfulBookings />} />
                        <Route path="/paid-clients" element={<PaidClients />} />
                        <Route path="/pending-requests" element={<PendingRequests />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/faqs" element={<FAQs />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="/ticket/:id" element={<TicketPage />} />
                        <Route path="/booking/:id/purchased" element={<PurchasedEvent />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-failed" element={<PaymentFailed />} />

                        <Route
                            path="*"
                            element={
                                <h1 className="text-3xl font-bold text-center mt-20">
                                    404 - Page Not Found
                                </h1>
                            }
                        />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;