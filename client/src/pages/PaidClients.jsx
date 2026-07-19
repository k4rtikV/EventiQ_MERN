import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const PaidClients = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchPaidClients();
    }, [user, navigate]);

    const fetchPaidClients = async () => {
        try {
            const res = await api.get('/bookings/admin/all');
            const paidBookings = (res.data || []).filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid');
            setClients(paidBookings);
        } catch (error) {
            console.error('Error fetching paid clients', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading paid clients...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-4 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/admin')} className="font-medium text-blue-700 hover:text-blue-900 transition">Admin Dashboard</button>
                <span className="text-gray-300">›</span>
                <span>Paid Clients</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold">Paid Clients</h1>
                    <p className="text-gray-500 mt-1">Confirmed bookings with completed payment and saved address details.</p>
                </div>
                <button onClick={() => navigate('/admin')} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-300">
                    Back to Admin Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {clients.length === 0 ? (
                        <li className="p-6 text-gray-500 text-center">No paid clients found.</li>
                    ) : clients.map(clientBooking => (
                        <li key={clientBooking._id} className="p-6 hover:bg-gray-50 transition border-l-4 border-l-blue-400">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{clientBooking.userId?.name || 'Unknown User'}</h4>
                                        <p className="text-sm text-gray-500">{clientBooking.userId?.email}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-blue-100 text-blue-700">paid</span>
                                        <span className="px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-green-100 text-green-700">confirmed</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-700">Event</p>
                                            <p className="text-gray-500">{clientBooking.eventId?.title || 'Deleted Event'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Amount</p>
                                            <p className="text-gray-500">{clientBooking.amount === 0 ? 'Free' : `₹${clientBooking.amount}`}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Phone</p>
                                            <p className="text-gray-500">{clientBooking.address?.phone || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Address</p>
                                            <p className="text-gray-500">{clientBooking.address ? `${clientBooking.address.street}, ${clientBooking.address.city}, ${clientBooking.address.state}, ${clientBooking.address.zip}, ${clientBooking.address.country}` : 'No address saved'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PaidClients;
