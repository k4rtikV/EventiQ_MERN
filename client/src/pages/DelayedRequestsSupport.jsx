import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const statusStyle = {
    open: 'bg-red-100 text-red-700', in_progress: 'bg-yellow-100 text-yellow-800', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-200 text-gray-700'
};

const DelayedRequestsSupport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        try {
            const params = {};
            if (type !== 'all') params.type = type;
            if (status !== 'all') params.status = status;
            const { data } = await api.get('/support/admin/requests', { params });
            setRequests(data);
        } catch (error) { alert(error.response?.data?.message || 'Unable to load support requests.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        load();
    }, [user, navigate, type, status]);

    const visible = useMemo(() => requests.filter((request) => {
        const haystack = `${request.user?.name} ${request.user?.email} ${request.booking?._id} ${request.booking?.eventId?.title}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
    }), [requests, search]);

    const approveTicket = async (request) => {
        if (!window.confirm('Approve this paid booking and assign its ticket?')) return;
        try { setBusyId(request._id); await api.put(`/bookings/${request.booking._id}/confirm`); await load(); }
        catch (error) { alert(error.response?.data?.message || 'Unable to approve booking.'); }
        finally { setBusyId(null); }
    };

    const viewInvoice = async (bookingId) => {
        const win = window.open('', '_blank');
        try {
            const response = await api.get(`/bookings/${bookingId}/invoice`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            if (win) win.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) { if (win) win.close(); alert(error.response?.data?.message || 'Unable to open invoice.'); }
    };

    if (loading) return <div className="py-20 text-center text-lg font-semibold">Loading delayed support requests...</div>;

    return (
        <div className="mx-auto max-w-7xl py-6">
            <div className="mb-4 text-sm text-gray-500"><button onClick={() => navigate('/admin')} className="font-bold text-blue-700 hover:text-blue-900">Admin Dashboard</button> <span className="mx-2">›</span> Delayed Requests Support</div>
            <div className="mb-7 rounded-2xl bg-gray-950 p-7 text-white shadow-lg">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Support Operations</p><h1 className="mt-2 text-3xl font-black">Delayed Requests Support</h1><p className="mt-2 text-gray-300">Review ticket-assignment and refund-initiation delays and take action directly.</p></div>
                    <button onClick={() => navigate('/admin')} className="rounded-xl border border-white/70 bg-white px-5 py-3 font-black text-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-300/40">Back to Admin Dashboard</button>
                </div>
            </div>

            <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto_auto]">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, event, email or booking ID" className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
                <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3 font-semibold"><option value="all">All request types</option><option value="ticket_delay">Ticket delays</option><option value="refund_delay">Refund delays</option></select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3 font-semibold"><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
            </div>

            <div className="space-y-5">
                {visible.length === 0 ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">No delayed support requests match these filters.</div> : visible.map((request) => {
                    const booking = request.booking;
                    const ticket = request.type === 'ticket_delay';
                    return (
                        <article key={request._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col justify-between gap-4 md:flex-row">
                                <div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${ticket ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{ticket ? 'Ticket Assignment Delay' : 'Refund Initiation Delay'}</span><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusStyle[request.status]}`}>{request.status.replace('_', ' ')}</span></div><h2 className="mt-3 text-xl font-black">{booking?.eventId?.title || 'Deleted Event'}</h2><p className="mt-1 text-sm text-gray-500">Submitted {new Date(request.createdAt).toLocaleString()}</p></div>
                                <div className="text-sm md:text-right"><p className="font-black">{request.user?.name}</p><p className="text-gray-500">{request.user?.email}</p><p className="mt-1 break-all text-xs text-gray-400">{booking?._id}</p></div>
                            </div>
                            <div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4"><div><b>Booking</b><p className="capitalize">{booking?.status}</p></div><div><b>Payment</b><p className="capitalize">{booking?.paymentStatus?.replace('_', ' ')}</p></div><div><b>Amount</b><p>₹{Number(booking?.amount || 0).toFixed(2)}</p></div><div><b>Refund</b><p className="capitalize">{booking?.refund?.status?.replaceAll('_', ' ') || 'Not started'}</p></div></div>
                            <div className="mt-4 rounded-xl border border-gray-200 p-4"><p className="text-xs font-black uppercase text-gray-500">Customer message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{request.message}</p>{request.adminNote && <p className="mt-3 border-t pt-3 text-sm text-gray-600"><b>Admin note:</b> {request.adminNote}</p>}</div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {ticket && booking?.status === 'pending' && booking?.paymentStatus === 'paid' && <button disabled={busyId === request._id} onClick={() => approveTicket(request)} className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">Approve & Assign Ticket</button>}
                                {!ticket && booking?.refund?.status === 'not_started' && <button onClick={() => navigate(`/admin/refunds/${booking._id}`)} className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]">Initiate Refund</button>}
                                <button onClick={() => viewInvoice(booking._id)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white hover:shadow-md active:translate-y-0 active:scale-[0.98]">View Invoice</button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default DelayedRequestsSupport;