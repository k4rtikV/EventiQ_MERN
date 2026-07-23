import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const NewsletterDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [subscribers, setSubscribers] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        promoUsed: 0,
        campaignsSent: 0
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [busySubscriberId, setBusySubscriberId] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        fetchDashboard();
    }, [user, navigate]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await api.get('/newsletter/admin/dashboard');
            setSubscribers(response.data.subscribers || []);
            setCampaigns(response.data.campaigns || []);
            setStats(response.data.stats || {});
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Unable to load the newsletter dashboard.'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredSubscribers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return subscribers.filter((subscriber) => {
            const matchesSearch =
                !normalizedSearch ||
                subscriber.name?.toLowerCase().includes(normalizedSearch) ||
                subscriber.email?.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && subscriber.isSubscribed) ||
                (statusFilter === 'inactive' && !subscriber.isSubscribed);

            return matchesSearch && matchesStatus;
        });
    }, [subscribers, search, statusFilter]);

    const handleSendNewsletter = async (event) => {
        event.preventDefault();
        setFeedback({ type: '', message: '' });

        if (subject.trim().length < 3) {
            setFeedback({ type: 'error', message: 'Enter a subject with at least 3 characters.' });
            return;
        }

        if (message.trim().length < 10) {
            setFeedback({ type: 'error', message: 'Enter a message with at least 10 characters.' });
            return;
        }

        if (!window.confirm(`Send this newsletter to ${stats.active || 0} active subscriber${stats.active === 1 ? '' : 's'}?`)) {
            return;
        }

        try {
            setSending(true);
            const response = await api.post('/newsletter/admin/send', {
                subject: subject.trim(),
                message: message.trim()
            });

            setSubject('');
            setMessage('');
            setFeedback({ type: 'success', message: response.data.message });
            await fetchDashboard();
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Unable to send the newsletter.'
            });
        } finally {
            setSending(false);
        }
    };

    const handleToggleSubscriber = async (subscriber) => {
        try {
            setBusySubscriberId(subscriber._id);
            const response = await api.put(
                `/newsletter/admin/subscribers/${subscriber._id}/status`,
                { isSubscribed: !subscriber.isSubscribed }
            );
            setFeedback({ type: 'success', message: response.data.message });
            await fetchDashboard();
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Unable to update the subscriber.'
            });
        } finally {
            setBusySubscriberId(null);
        }
    };

    const handleDeleteSubscriber = async (subscriber) => {
        if (!window.confirm(`Permanently remove ${subscriber.email} from the newsletter list?`)) {
            return;
        }

        try {
            setBusySubscriberId(subscriber._id);
            const response = await api.delete(`/newsletter/admin/subscribers/${subscriber._id}`);
            setFeedback({ type: 'success', message: response.data.message });
            await fetchDashboard();
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Unable to remove the subscriber.'
            });
        } finally {
            setBusySubscriberId(null);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-xl font-semibold">Loading newsletter dashboard...</div>;
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="font-bold text-blue-700 transition hover:text-blue-900"
                >
                    Admin Dashboard
                </button>
                <span>›</span>
                <span>Newsletter Dashboard</span>
            </div>

            <section className="mb-8 flex flex-col justify-between gap-5 rounded-2xl bg-slate-950 p-7 text-white shadow-lg md:flex-row md:items-center">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-blue-300">Audience & Campaigns</p>
                    <h1 className="text-3xl font-black">Newsletter Dashboard</h1>
                    <p className="mt-2 text-slate-300">Manage subscribers and send EventiQ announcements from one place.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="rounded-xl border border-white/20 bg-white px-5 py-3 font-extrabold text-slate-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                >
                    Back to Admin Dashboard
                </button>
            </section>

            {feedback.message && (
                <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
                {[
                    ['Total Subscribers', stats.total || 0, 'text-slate-900'],
                    ['Active', stats.active || 0, 'text-green-600'],
                    ['Inactive', stats.inactive || 0, 'text-red-500'],
                    ['Promo Used', stats.promoUsed || 0, 'text-purple-600'],
                    ['Campaigns Sent', stats.campaignsSent || 0, 'text-blue-600']
                ].map(([label, value, valueClass]) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">{label}</p>
                        <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.3fr]">
                <div className="space-y-8">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-900">Compose Newsletter</h2>
                        <p className="mt-1 text-sm text-gray-500">The message will be sent individually to every active subscriber.</p>

                        <form onSubmit={handleSendNewsletter} className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="newsletter-subject" className="mb-2 block text-sm font-bold text-gray-700">Subject</label>
                                <input
                                    id="newsletter-subject"
                                    type="text"
                                    maxLength="150"
                                    value={subject}
                                    onChange={(event) => setSubject(event.target.value)}
                                    placeholder="e.g., This Weekend's Featured Events"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="mt-1 text-right text-xs text-gray-400">{subject.length}/150</p>
                            </div>

                            <div>
                                <label htmlFor="newsletter-message" className="mb-2 block text-sm font-bold text-gray-700">Message</label>
                                <textarea
                                    id="newsletter-message"
                                    rows="11"
                                    maxLength="10000"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder="Write the newsletter message shown to your subscribers..."
                                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="mt-1 text-right text-xs text-gray-400">{message.length}/10000</p>
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !stats.active}
                                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {sending ? 'Sending Newsletter...' : `Send to ${stats.active || 0} Active Subscriber${stats.active === 1 ? '' : 's'}`}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900">Recent Campaigns</h2>
                        <div className="mt-5 space-y-3">
                            {campaigns.length === 0 ? (
                                <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">No newsletter campaigns have been sent yet.</p>
                            ) : (
                                campaigns.map((campaign) => (
                                    <article key={campaign._id} className="rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="font-extrabold text-slate-900">{campaign.subject}</h3>
                                            <span className="shrink-0 text-xs text-gray-500">{new Date(campaign.sentAt).toLocaleString()}</span>
                                        </div>
                                        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-gray-600">{campaign.message}</p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Recipients: {campaign.recipientCount}</span>
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Delivered: {campaign.deliveredCount}</span>
                                            {campaign.failedCount > 0 && (
                                                <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Failed: {campaign.failedCount}</span>
                                            )}
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Subscribers</h2>
                            <p className="mt-1 text-sm text-gray-500">Search, deactivate, reactivate, or permanently remove subscribers.</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="px-3 py-3">Subscriber</th>
                                    <th className="px-3 py-3">Joined</th>
                                    <th className="px-3 py-3">Promo</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSubscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-10 text-center text-gray-500">No subscribers match the selected filters.</td>
                                    </tr>
                                ) : (
                                    filteredSubscribers.map((subscriber) => (
                                        <tr key={subscriber._id} className="transition hover:bg-gray-50">
                                            <td className="px-3 py-4">
                                                <p className="font-bold text-slate-900">{subscriber.name}</p>
                                                <p className="text-sm text-gray-500">{subscriber.email}</p>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-600">{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                                            <td className="px-3 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${subscriber.promoUsed ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {subscriber.promoUsed ? 'Used' : 'Unused'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${subscriber.isSubscribed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {subscriber.isSubscribed ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busySubscriberId === subscriber._id}
                                                        onClick={() => handleToggleSubscriber(subscriber)}
                                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${subscriber.isSubscribed ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'}`}
                                                    >
                                                        {subscriber.isSubscribed ? 'Deactivate' : 'Reactivate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busySubscriberId === subscriber._id}
                                                        onClick={() => handleDeleteSubscriber(subscriber)}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NewsletterDashboard;
