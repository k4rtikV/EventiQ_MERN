import React, {
    useContext,
    useEffect,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import QRCodeGenerator from 'qrcode';
import { jsPDF } from 'jspdf';
import { FaArrowLeft } from 'react-icons/fa';

import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const TicketPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const [ticketImageUrl, setTicketImageUrl] =
        useState('');

    const [imageLoading, setImageLoading] =
        useState(true);

    const [qrCodeUrl, setQrCodeUrl] =
        useState('');

    const [downloadStatus, setDownloadStatus] =
        useState('idle');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return undefined;
        }

        let eventImageObjectUrl = '';
        let isMounted = true;

        const fetchTicket = async () => {
            try {
                const { data } = await api.get(
                    `/bookings/${id}`
                );

                if (!isMounted) {
                    return;
                }

                setBooking(data);

                const eventId =
                    data?.eventId?._id;

                if (eventId) {
                    try {
                        const imageResponse =
                            await api.get(
                                `/events/${eventId}/image`,
                                {
                                    responseType:
                                        'blob'
                                }
                            );

                        if (isMounted) {
                            eventImageObjectUrl =
                                URL.createObjectURL(
                                    imageResponse.data
                                );

                            setTicketImageUrl(
                                eventImageObjectUrl
                            );
                        }
                    } catch (imageError) {
                        console.error(
                            'Error loading event image:',
                            imageError
                        );

                        if (isMounted) {
                            setTicketImageUrl('');
                        }
                    }
                }

                const bookingUserId =
                    user?.id ||
                    user?._id ||
                    data?.userId?._id ||
                    data?.userId ||
                    'anonymous';

                const qrValue =
                    `${data._id}-${bookingUserId}`;

                const generatedQrCode =
                    await QRCodeGenerator.toDataURL(
                        qrValue,
                        {
                            width: 700,
                            margin: 2,
                            errorCorrectionLevel:
                                'H',
                            color: {
                                dark: '#000000',
                                light: '#ffffff'
                            }
                        }
                    );

                if (isMounted) {
                    setQrCodeUrl(
                        generatedQrCode
                    );
                }
            } catch (error) {
                console.error(
                    'Error fetching ticket:',
                    error
                );

                if (isMounted) {
                    navigate('/dashboard');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setImageLoading(false);
                }
            }
        };

        fetchTicket();

        return () => {
            isMounted = false;

            if (eventImageObjectUrl) {
                URL.revokeObjectURL(
                    eventImageObjectUrl
                );
            }
        };
    }, [id, navigate, user]);

    const loadImage = (source) =>
        new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => resolve(image);

            image.onerror = () => {
                reject(
                    new Error(
                        'Unable to load image.'
                    )
                );
            };

            image.src = source;
        });

    const convertImageToJpeg = async (
        source
    ) => {
        const image = await loadImage(source);

        const canvas =
            document.createElement('canvas');

        const maximumWidth = 1400;
        const scale = Math.min(
            maximumWidth / image.naturalWidth,
            1
        );

        canvas.width = Math.max(
            Math.round(
                image.naturalWidth * scale
            ),
            1
        );

        canvas.height = Math.max(
            Math.round(
                image.naturalHeight * scale
            ),
            1
        );

        const context =
            canvas.getContext('2d');

        if (!context) {
            throw new Error(
                'Unable to process the event image.'
            );
        }

        context.fillStyle = '#ffffff';

        context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return {
            dataUrl: canvas.toDataURL(
                'image/jpeg',
                0.9
            ),
            width: canvas.width,
            height: canvas.height
        };
    };

    const drawContainedImage = (
        pdf,
        imageData,
        imageWidth,
        imageHeight,
        x,
        y,
        boxWidth,
        boxHeight
    ) => {
        const imageRatio =
            imageWidth / imageHeight;

        const boxRatio =
            boxWidth / boxHeight;

        let renderWidth;
        let renderHeight;
        let renderX;
        let renderY;

        if (imageRatio > boxRatio) {
            renderWidth = boxWidth;
            renderHeight =
                boxWidth / imageRatio;

            renderX = x;
            renderY =
                y +
                (boxHeight -
                    renderHeight) /
                    2;
        } else {
            renderHeight = boxHeight;
            renderWidth =
                boxHeight * imageRatio;

            renderX =
                x +
                (boxWidth -
                    renderWidth) /
                    2;

            renderY = y;
        }

        pdf.addImage(
            imageData,
            'JPEG',
            renderX,
            renderY,
            renderWidth,
            renderHeight
        );
    };

    const drawLabelAndValue = (
        pdf,
        label,
        value,
        x,
        y,
        maximumWidth = 70
    ) => {
        pdf.setFont(
            'helvetica',
            'bold'
        );

        pdf.setFontSize(9);
        pdf.setTextColor(
            15,
            23,
            42
        );

        pdf.text(label, x, y);

        pdf.setFont(
            'helvetica',
            'normal'
        );

        pdf.setFontSize(9);
        pdf.setTextColor(
            51,
            65,
            85
        );

        const valueLines =
            pdf.splitTextToSize(
                String(value || '—'),
                maximumWidth
            );

        pdf.text(
            valueLines,
            x,
            y + 6
        );
    };

    const handleDownload = async () => {
        if (
            !booking ||
            !qrCodeUrl ||
            downloadStatus === 'started'
        ) {
            return;
        }

        setDownloadStatus('started');

        try {
            const event = booking.eventId;

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth =
                pdf.internal.pageSize.getWidth();

            const pageHeight =
                pdf.internal.pageSize.getHeight();

            const margin = 14;
            const ticketX = margin;
            const ticketY = 24;
            const ticketWidth =
                pageWidth - margin * 2;
            const ticketHeight = 155;

            const leftWidth = 172;
            const rightWidth =
                ticketWidth - leftWidth;

            const leftX = ticketX;
            const rightX =
                ticketX + leftWidth;

            pdf.setFillColor(
                248,
                250,
                252
            );

            pdf.rect(
                0,
                0,
                pageWidth,
                pageHeight,
                'F'
            );

            pdf.setFont(
                'helvetica',
                'bold'
            );

            pdf.setFontSize(22);
            pdf.setTextColor(
                15,
                23,
                42
            );

            pdf.text(
                'EventiQ',
                margin,
                14
            );

            pdf.setFont(
                'helvetica',
                'normal'
            );

            pdf.setFontSize(9);
            pdf.setTextColor(
                100,
                116,
                139
            );

            pdf.text(
                'Official Event Ticket',
                pageWidth - margin,
                14,
                {
                    align: 'right'
                }
            );

            pdf.setFillColor(
                255,
                255,
                255
            );

            pdf.setDrawColor(
                226,
                232,
                240
            );

            pdf.setLineWidth(0.4);

            pdf.roundedRect(
                ticketX,
                ticketY,
                ticketWidth,
                ticketHeight,
                5,
                5,
                'FD'
            );

            pdf.line(
                rightX,
                ticketY,
                rightX,
                ticketY + ticketHeight
            );

            const imageX =
                leftX + 5;

            const imageY =
                ticketY + 5;

            const imageWidth =
                leftWidth - 10;

            const imageHeight = 55;

            pdf.setFillColor(
                241,
                245,
                249
            );

            pdf.roundedRect(
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                3,
                3,
                'F'
            );

            if (ticketImageUrl) {
                try {
                    const processedImage =
                        await convertImageToJpeg(
                            ticketImageUrl
                        );

                    drawContainedImage(
                        pdf,
                        processedImage.dataUrl,
                        processedImage.width,
                        processedImage.height,
                        imageX,
                        imageY,
                        imageWidth,
                        imageHeight
                    );
                } catch (imageError) {
                    console.error(
                        'Unable to add event image to PDF:',
                        imageError
                    );

                    pdf.setFont(
                        'helvetica',
                        'normal'
                    );

                    pdf.setFontSize(10);
                    pdf.setTextColor(
                        100,
                        116,
                        139
                    );

                    pdf.text(
                        'Event image unavailable',
                        imageX +
                            imageWidth / 2,
                        imageY +
                            imageHeight / 2,
                        {
                            align: 'center'
                        }
                    );
                }
            }

            const contentX =
                leftX + 10;

            const contentWidth =
                leftWidth - 20;

            let currentY =
                imageY +
                imageHeight +
                12;

            pdf.setFont(
                'helvetica',
                'bold'
            );

            pdf.setFontSize(17);
            pdf.setTextColor(
                15,
                23,
                42
            );

            const titleLines =
                pdf.splitTextToSize(
                    event?.title ||
                        'Event',
                    contentWidth
                );

            pdf.text(
                titleLines,
                contentX,
                currentY
            );

            currentY +=
                titleLines.length * 7;

            pdf.setFont(
                'helvetica',
                'normal'
            );

            pdf.setFontSize(9);
            pdf.setTextColor(
                100,
                116,
                139
            );

            pdf.text(
                event?.category ||
                    'Event',
                contentX,
                currentY + 2
            );

            currentY += 15;

            const eventDate =
                new Date(event.date);

            const dateText =
                eventDate.toLocaleDateString(
                    'en-IN'
                );

            const timeText =
                eventDate.toLocaleTimeString(
                    'en-IN',
                    {
                        hour: '2-digit',
                        minute:
                            '2-digit'
                    }
                );

            const columnOneX =
                contentX;

            const columnTwoX =
                contentX + 78;

            drawLabelAndValue(
                pdf,
                'Date',
                dateText,
                columnOneX,
                currentY,
                65
            );

            drawLabelAndValue(
                pdf,
                'Time',
                timeText,
                columnTwoX,
                currentY,
                65
            );

            currentY += 23;

            drawLabelAndValue(
                pdf,
                'Location',
                event.location,
                columnOneX,
                currentY,
                65
            );

            drawLabelAndValue(
                pdf,
                'Status',
                booking.status,
                columnTwoX,
                currentY,
                65
            );

            currentY += 27;

            pdf.setDrawColor(
                226,
                232,
                240
            );

            pdf.line(
                contentX,
                currentY,
                contentX +
                    contentWidth,
                currentY
            );

            currentY += 10;

            const amount =
                Number(
                    booking.amount
                ) || 0;

            const priceText =
                amount === 0
                    ? 'Free'
                    : `INR ${amount.toLocaleString(
                          'en-IN'
                      )}`;

            drawLabelAndValue(
                pdf,
                'Price',
                priceText,
                columnOneX,
                currentY,
                65
            );

            drawLabelAndValue(
                pdf,
                'Booking ID',
                booking._id,
                columnTwoX,
                currentY,
                70
            );

            const qrSize = 58;

            const qrX =
                rightX +
                (rightWidth -
                    qrSize) /
                    2;

            const qrY =
                ticketY + 16;

            pdf.setFillColor(
                248,
                250,
                252
            );

            pdf.roundedRect(
                rightX + 10,
                ticketY + 8,
                rightWidth - 20,
                78,
                5,
                5,
                'F'
            );

            pdf.setFillColor(
                255,
                255,
                255
            );

            pdf.setDrawColor(
                226,
                232,
                240
            );

            pdf.roundedRect(
                qrX - 4,
                qrY - 4,
                qrSize + 8,
                qrSize + 8,
                4,
                4,
                'FD'
            );

            pdf.addImage(
                qrCodeUrl,
                'PNG',
                qrX,
                qrY,
                qrSize,
                qrSize
            );

            pdf.setFont(
                'helvetica',
                'normal'
            );

            pdf.setFontSize(8);
            pdf.setTextColor(
                71,
                85,
                105
            );

            pdf.text(
                'Scan QR code at the entrance',
                rightX +
                    rightWidth / 2,
                ticketY + 94,
                {
                    align: 'center'
                }
            );

            const detailsCenterX =
                rightX +
                rightWidth / 2;

            let detailsY =
                ticketY + 108;

            pdf.setFont(
                'helvetica',
                'bold'
            );

            pdf.setFontSize(9);
            pdf.setTextColor(
                15,
                23,
                42
            );

            pdf.text(
                'Seat',
                detailsCenterX,
                detailsY,
                {
                    align: 'center'
                }
            );

            pdf.setFont(
                'helvetica',
                'normal'
            );

            pdf.text(
                booking.seat ||
                    'General Admission',
                detailsCenterX,
                detailsY + 6,
                {
                    align: 'center'
                }
            );

            detailsY += 18;

            pdf.setFont(
                'helvetica',
                'bold'
            );

            pdf.text(
                'Venue',
                detailsCenterX,
                detailsY,
                {
                    align: 'center'
                }
            );

            pdf.setFont(
                'helvetica',
                'normal'
            );

            const venueLines =
                pdf.splitTextToSize(
                    event.location || '—',
                    rightWidth - 20
                );

            pdf.text(
                venueLines,
                detailsCenterX,
                detailsY + 6,
                {
                    align: 'center'
                }
            );

            detailsY +=
                14 +
                venueLines.length * 4;

            pdf.setFont(
                'helvetica',
                'bold'
            );

            pdf.text(
                'Issued to',
                detailsCenterX,
                detailsY,
                {
                    align: 'center'
                }
            );

            pdf.setFont(
                'helvetica',
                'normal'
            );

            const issuedTo =
                user?.name ||
                booking.userId?.name ||
                'EventiQ User';

            pdf.text(
                `${issuedTo} - Admit One`,
                detailsCenterX,
                detailsY + 6,
                {
                    align: 'center'
                }
            );

            pdf.setFontSize(7.5);
            pdf.setTextColor(
                100,
                116,
                139
            );

            pdf.text(
                'This ticket is valid for one attendee only.',
                pageWidth / 2,
                pageHeight - 12,
                {
                    align: 'center'
                }
            );

            const safeTitle = String(
                event?.title || 'ticket'
            )
                .replace(
                    /[^a-z0-9-]/gi,
                    '_'
                )
                .slice(0, 40);

            pdf.save(
                `${safeTitle}-${booking._id}.pdf`
            );

            setDownloadStatus('done');

            setTimeout(() => {
                setDownloadStatus('idle');
            }, 3000);
        } catch (error) {
            console.error(
                'Error generating ticket PDF:',
                error
            );

            setDownloadStatus('error');

            setTimeout(() => {
                setDownloadStatus('idle');
            }, 3500);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold">
                Loading ticket...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20 text-xl font-semibold">
                Ticket not found.
            </div>
        );
    }

    if (
        booking.status !== 'confirmed'
    ) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center">
                <h2 className="text-xl font-semibold mb-4">
                    Ticket not available yet
                </h2>

                <p className="text-gray-600 mb-6">
                    Your booking is currently{' '}
                    <strong>
                        {booking.status}
                    </strong>
                    . The ticket will be
                    available once an admin
                    confirms your booking.
                </p>

                <button
                    type="button"
                    onClick={() =>
                    navigate(
                            '/dashboard'
                            )
                        }
                        className="group inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black dark:hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                        >
                        <FaArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                            Return to dashboard
                        </button>
            </div>
        );
    }

    const event = booking.eventId;

    const displayPrice =
        Number(booking.amount) === 0
            ? 'Free'
            : `₹${Number(
                  booking.amount
              ).toLocaleString('en-IN')}`;

    return (
        <div className="max-w-3xl mx-auto py-5">
            {downloadStatus !== 'idle' && (
                <div className="fixed top-6 right-6 z-50">
                    <div
                        className={`max-w-xs px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
                            downloadStatus ===
                            'started'
                                ? 'bg-blue-600'
                                : downloadStatus ===
                                    'done'
                                  ? 'bg-green-600'
                                  : 'bg-red-600'
                        }`}
                    >
                        {downloadStatus ===
                            'started' &&
                            'Preparing download...'}

                        {downloadStatus ===
                            'done' &&
                            'Download ready — saved as PDF'}

                        {downloadStatus ===
                            'error' &&
                            'Download failed — check console'}
                    </div>
                </div>
            )}

            <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="group inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
    >
                    <FaArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                        Back to dashboard
                    </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-hidden h-40 bg-gray-100">
                        {imageLoading ? (
                            <div className="w-full h-full bg-gray-100 animate-pulse" />
                        ) : ticketImageUrl ? (
                            <img
                                src={ticketImageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center px-6 text-center text-sm text-gray-500">
                                Event image unavailable
                            </div>
                        )}
                    </div>

                    <div className="p-5 md:p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {event.title}
                        </h2>

                        <p className="text-gray-500 text-sm mb-5">
                            {event.category ||
                                'Event'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    Date
                                </p>

                                <p>
                                    {new Date(
                                        event.date
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900">
                                    Time
                                </p>

                                <p>
                                    {new Date(
                                        event.date
                                    ).toLocaleTimeString(
                                        [],
                                        {
                                            hour: '2-digit',
                                            minute:
                                                '2-digit'
                                        }
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900">
                                    Location
                                </p>

                                <p>
                                    {event.location}
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900">
                                    Status
                                </p>

                                <p className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold">
                                    {booking.status}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">
                                    Price
                                </p>

                                <p>{displayPrice}</p>
                            </div>

                            <div>
                                <p className="font-semibold">
                                    Booking ID
                                </p>

                                <p className="text-xs text-gray-500 break-all">
                                    {booking._id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col justify-between">
                    <div className="p-5">
                        <div className="bg-gray-50 rounded-3xl p-4 text-center">
                            <div className="inline-flex items-center justify-center bg-white p-3 rounded-3xl border border-gray-200">
                                {qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="Booking QR code"
                                        className="block w-[130px] h-[130px]"
                                        width="130"
                                        height="130"
                                    />
                                ) : (
                                    <div className="w-[130px] h-[130px] bg-gray-100 animate-pulse rounded-xl" />
                                )}
                            </div>

                            <p className="text-gray-500 text-xs mt-2">
                                Scan QR code at the entrance.
                            </p>
                        </div>

                        <div className="mt-5 text-center text-sm text-gray-700 space-y-4">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    Seat
                                </p>

                                <p>
                                    {booking.seat ||
                                        'General Admission'}
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900">
                                    Venue
                                </p>

                                <p>
                                    {event.location}
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900">
                                    Issued to
                                </p>

                                <p>
                                    {user?.name ||
                                        booking.userId
                                            ?.name ||
                                        'EventiQ User'}{' '}
                                    — Admit One
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={
                                downloadStatus ===
                                    'started' ||
                                !qrCodeUrl
                            }
                            className="w-full bg-white border border-gray-200 text-gray-900 py-3 rounded-3xl font-semibold hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {downloadStatus ===
                            'started'
                                ? 'Preparing PDF...'
                                : 'Download PDF'}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate('/dashboard')
                            }
                            className="w-full bg-gray-900 text-white py-3 rounded-3xl font-semibold hover:bg-black"
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