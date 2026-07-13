import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const AddressDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
    });

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get(`/bookings/${id}`);
                setBooking(data);
                if (data.address) {
                    setForm({
                        street: data.address.street || '',
                        city: data.address.city || '',
                        state: data.address.state || '',
                        zip: data.address.zip || '',
                        country: data.address.country || '',
                        phone: data.address.phone || ''
                    });
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load booking details');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put(`/bookings/${id}/address`, form);
            navigate(`/booking/${id}/payment`);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to save address');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading booking...</div>;
    if (!booking) return <div className="text-center py-20 text-xl font-semibold text-red-500">Booking not found.</div>;

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 mt-10 border border-gray-100">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">Enter Your Address</h1>
                <p className="text-gray-500 mt-2">One more step before payment.</p>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

            <form onSubmit={handleSaveAddress} className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Street Address</span>
                        <input
                            type="text"
                            value={form.street}
                            onChange={(e) => setForm({ ...form, street: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">City</span>
                        <input
                            type="text"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">State</span>
                        <input
                            type="text"
                            value={form.state}
                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">ZIP / Postal Code</span>
                        <input
                            type="text"
                            value={form.zip}
                            onChange={(e) => setForm({ ...form, zip: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Country</span>
                        <input
                            type="text"
                            value={form.country}
                            onChange={(e) => setForm({ ...form, country: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Phone</span>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gray-900 text-white rounded-2xl py-4 text-lg font-bold hover:bg-black transition"
                >
                    {saving ? 'Saving...' : 'Continue to Payment'}
                </button>
            </form>
        </div>
    );
};

export default AddressDetails;
