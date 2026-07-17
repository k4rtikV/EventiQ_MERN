import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const TicketPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const ticketRef = useRef(null);
    const [downloadStatus, setDownloadStatus] = useState('idle'); // 'idle' | 'started' | 'done' | 'error'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchBooking = async () => {
            try {
                const { data } = await api.get(`/bookings/${id}`);
                setBooking(data);
            } catch (error) {
                console.error('Error fetching ticket', error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id, navigate, user]);

    if (loading) {
        return <div className="text-center py-20 text-xl font-semibold">Loading ticket...</div>;
    }

    if (!booking) {
        return <div className="text-center py-20 text-xl font-semibold">Ticket not found.</div>;
    }

    if (booking.status !== 'confirmed') {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center">
                <h2 className="text-xl font-semibold mb-4">Ticket not available yet</h2>
                <p className="text-gray-600 mb-6">Your booking is currently <strong>{booking.status}</strong>. The ticket will be available once an admin confirms your booking.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gray-900 text-white px-6 py-3 rounded-md shadow-sm hover:bg-black active:scale-95 transform transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloadStatus('started');
        try {
            const html2canvasMod = await import('html2canvas');
            const html2canvas = html2canvasMod.default || html2canvasMod;
            const { jsPDF } = await import('jspdf');
            // Clone the ticket and inline computed styles to avoid modern color functions like `oklch`
            const original = ticketRef.current;
            const clone = original.cloneNode(true);
            const originalNodes = Array.from(original.querySelectorAll('*'));
            const cloneNodes = Array.from(clone.querySelectorAll('*'));

            // inline computed styles (color, background, border, boxShadow, fill, stroke)
            const propsToCopy = ['color', 'backgroundColor', 'borderColor', 'boxShadow', 'fill', 'stroke', 'fontFamily', 'fontSize', 'lineHeight'];
            // also include root element
            const rootComputed = window.getComputedStyle(original);
            propsToCopy.forEach((p) => {
                if (rootComputed[p]) clone.style[p] = rootComputed[p];
            });

            for (let i = 0; i < originalNodes.length; i++) {
                const o = originalNodes[i];
                const c = cloneNodes[i];
                if (!c) continue;
                const cs = window.getComputedStyle(o);
                propsToCopy.forEach((prop) => {
                    try {
                        const val = cs[prop];
                        if (val) c.style[prop] = val;
                    } catch (e) {
                        // ignore unsupported properties
                    }
                });
            }

            // sanitize any modern color functions (oklch etc.) by replacing with safe fallbacks
            for (let i = 0; i < cloneNodes.length; i++) {
                const c = cloneNodes[i];
                try {
                    // remove box shadows (can contain modern color tokens)
                    c.style.boxShadow = 'none';
                    // if any inlined color contains 'oklch', replace with safe RGB/hex
                    if (c.style.backgroundColor && c.style.backgroundColor.includes('oklch')) {
                        c.style.backgroundColor = '#ffffff';
                    }
                    if (c.style.color && c.style.color.includes('oklch')) {
                        c.style.color = '#0f172a';
                    }
                    if (c.style.borderColor && c.style.borderColor.includes('oklch')) {
                        c.style.borderColor = 'transparent';
                    }
                    if (c.style.fill && c.style.fill.includes('oklch')) {
                        c.style.fill = '#000000';
                    }
                    if (c.style.stroke && c.style.stroke.includes('oklch')) {
                        c.style.stroke = '#000000';
                    }
                } catch (e) {
                    // ignore
                }
            }

            // place clone offscreen for rendering
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = `${original.offsetWidth}px`;
            document.body.appendChild(clone);

            // Replace any inline SVGs (like the QR) with <img> data URLs so html2canvas captures them reliably
            try {
                const svgs = clone.querySelectorAll('svg');
                svgs.forEach((svg) => {
                    try {
                        const serializer = new XMLSerializer();
                        const svgString = serializer.serializeToString(svg);
                        const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
                        const img = document.createElement('img');
                        img.src = encoded;
                        // copy sizing
                        const w = svg.getAttribute('width') || svg.clientWidth || svg.getBoundingClientRect().width;
                        const h = svg.getAttribute('height') || svg.clientHeight || svg.getBoundingClientRect().height;
                        if (w) img.style.width = typeof w === 'number' ? `${w}px` : w;
                        if (h) img.style.height = typeof h === 'number' ? `${h}px` : h;
                        img.style.display = 'block';
                        img.crossOrigin = 'anonymous';
                        svg.parentNode.replaceChild(img, svg);
                    } catch (e) {
                        // ignore individual svg failures
                    }
                });
            } catch (e) {
                // ignore
            }

            let canvas;
            try {
                canvas = await html2canvas(clone, { scale: 2, useCORS: true });
            } catch (htmlErr) {
                console.warn('html2canvas failed, falling back to dom-to-image-more', htmlErr);
                try {
                    const d2iMod = await import('dom-to-image-more');
                    const d2i = d2iMod.default || d2iMod;
                    // toPng returns a dataURL
                    const dataUrl = await d2i.toPng(clone, { quality: 1, bgcolor: '#ffffff' });
                    // convert dataURL to canvas
                    const img = new Image();
                    img.src = dataUrl;
                    await new Promise((res, rej) => {
                        img.onload = res;
                        img.onerror = rej;
                    });
                    canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                } catch (d2iErr) {
                    console.error('dom-to-image-more fallback failed', d2iErr);
                    document.body.removeChild(clone);
                    throw htmlErr; // rethrow original to be handled by outer catch
                }
            }
            // remove clone from DOM
            document.body.removeChild(clone);
            const imgData = canvas.toDataURL('image/png');

            // create PDF and draw the captured ticket image first
            const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = { width: canvas.width, height: canvas.height };
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            if (imgHeight > pdfHeight) {
                let heightLeft = imgHeight - pdfHeight;
                while (heightLeft > 0) {
                    position = -heightLeft;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }
            }

            // generate QR image data (fallback) and overlay into the PDF at the QR element position
            try {
                const qrcodeMod = await import('qrcode');
                const qrcode = qrcodeMod.default || qrcodeMod;
                const qrValue = `${booking._id}-${user?.id || 'anonymous'}`;
                const qrDataUrl = await qrcode.toDataURL(qrValue, { margin: 0, width: 260 });

                // find QR element in the original ticket to compute placement
                const qrEl = original.querySelector('svg') || original.querySelector('canvas') || original.querySelector('img');
                if (qrEl) {
                    const origRect = original.getBoundingClientRect();
                    const qrRect = qrEl.getBoundingClientRect();
                    const relLeft = qrRect.left - origRect.left;
                    const relTop = qrRect.top - origRect.top;
                    const scaleRatio = canvas.width / original.offsetWidth; // pixels in canvas per original px
                    const pdfScale = pdfWidth / canvas.width; // pdf points per canvas px
                    const xPdf = relLeft * scaleRatio * pdfScale;
                    const yPdf = relTop * scaleRatio * pdfScale;
                    const wPdf = (qrRect.width * scaleRatio) * pdfScale;
                    const hPdf = (qrRect.height * scaleRatio) * pdfScale;

                    // determine which page the QR falls on
                    const pageIndex = Math.floor(yPdf / pdfHeight);
                    const yOnPage = yPdf - pageIndex * pdfHeight;
                    const targetPage = Math.min(pageIndex + 1, pdf.getNumberOfPages());
                    pdf.setPage(targetPage);
                    pdf.addImage(qrDataUrl, 'PNG', xPdf, yOnPage, wPdf, hPdf);
                }
            } catch (e) {
                // ignore QR fallback failures
                console.warn('QR fallback generation failed', e);
            }
            const safeTitle = (booking?.eventId?.title || 'ticket').replace(/[^a-z0-9\-]/gi, '_').slice(0, 40);
            pdf.save(`${safeTitle}-${booking?._id || 'ticket'}.pdf`);
            setDownloadStatus('done');
            setTimeout(() => setDownloadStatus('idle'), 3000);
        } catch (err) {
            console.error('Error generating PDF', err);
            setDownloadStatus('error');
            setTimeout(() => setDownloadStatus('idle'), 3500);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-5">
            {/* Toast notifications */}
            {downloadStatus !== 'idle' && (
                <div className="fixed top-6 right-6 z-50">
                    <div className={`max-w-xs px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${downloadStatus === 'started' ? 'bg-blue-600' : downloadStatus === 'done' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {downloadStatus === 'started' && 'Preparing download...'}
                        {downloadStatus === 'done' && 'Download ready — saved as PDF'}
                        {downloadStatus === 'error' && 'Download failed — check console'}
                    </div>
                </div>
            )}
            <div className="mb-4">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                    ← Back to Dashboard
                </button>
            </div>
            <div ref={ticketRef} className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-hidden h-40">
                        <img
                            src={booking.eventId.image || 'https://via.placeholder.com/640x360'}
                            alt={booking.eventId.title}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                        />
                    </div>
                    <div className="p-5 md:p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.eventId.title}</h2>
                        <p className="text-gray-500 text-sm mb-5">{booking.eventId.category || 'Event'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Date</p>
                                <p>{new Date(booking.eventId.date).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Time</p>
                                <p>{new Date(booking.eventId.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Location</p>
                                <p>{booking.eventId.location}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Status</p>
                                <p className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">{booking.status}</p>
                            </div>
                        </div>
                        <div className="mt-5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Price</p>
                                <p>{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Booking ID</p>
                                <p className="text-xs text-gray-500 break-all">{booking._id}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col justify-between">
                    <div className="p-5">
                        <div className="bg-gray-50 rounded-3xl p-4 text-center">
                            <div className="inline-block bg-white p-3 rounded-3xl shadow-sm border border-gray-200">
                                <QRCode value={`${booking._id}-${user?.id || 'anonymous'}`} size={130} />
                            </div>
                            <p className="text-gray-500 text-xs mt-2">Scan QR code at the entrance.</p>
                        </div>
                        <div className="mt-5 text-center text-sm text-gray-700 space-y-4">
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Seat</p>
                                <p>{booking.seat || 'General Admission'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Venue</p>
                                <p>{booking.eventId.location}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">Issued to</p>
                                <p>{user?.name} — Admit One</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                        <button
                            type="button"
                            onClick={() => { console.log('download clicked'); handleDownload(); }}
                            className="w-full bg-white border border-gray-200 text-gray-900 py-3 rounded-3xl font-semibold hover:bg-blue-600 hover:text-white active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition transform active:scale-95 relative z-20 pointer-events-auto"
                        >
                            Download PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-gray-900 text-white py-3 rounded-3xl font-semibold hover:bg-black transition relative z-20 pointer-events-auto"
                        >
                            Hide Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketPage;
