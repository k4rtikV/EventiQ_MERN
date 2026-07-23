import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import {
    FaComments,
    FaPaperPlane,
    FaRobot,
    FaTimes,
    FaTrashAlt,
    FaUser
} from 'react-icons/fa';

import {
    useNavigate
} from 'react-router-dom';

const INITIAL_MESSAGE = {
    id: 'welcome-message',
    sender: 'bot',
    text:
        'Hi! I am the EventiQ assistant. I can help you with event bookings, payments, tickets, cancellations, refunds, invoices, wishlists and support.',
    suggestions: [
        'How do I book an event?',
        'Where is my ticket?',
        'How do refunds work?'
    ]
};

const CHAT_STORAGE_KEY =
    'eventiq-chatbot-messages';

const normalizeText = (value = '') =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s₹-]/g, ' ')
        .replace(/\s+/g, ' ');

const includesAny = (
    text,
    keywords
) =>
    keywords.some((keyword) =>
        text.includes(keyword)
    );

const createMessage = (
    sender,
    text,
    extra = {}
) => ({
    id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
    sender,
    text,
    ...extra
});

const EventiQChatbot = () => {
    const navigate = useNavigate();

    const [isOpen, setIsOpen] =
        useState(false);

    const [input, setInput] =
        useState('');

    const [isTyping, setIsTyping] =
        useState(false);

    const [messages, setMessages] =
        useState(() => {
            try {
                const storedMessages =
                    localStorage.getItem(
                        CHAT_STORAGE_KEY
                    );

                if (!storedMessages) {
                    return [
                        INITIAL_MESSAGE
                    ];
                }

                const parsedMessages =
                    JSON.parse(
                        storedMessages
                    );

                return Array.isArray(
                    parsedMessages
                ) &&
                    parsedMessages.length >
                        0
                    ? parsedMessages
                    : [INITIAL_MESSAGE];
            } catch {
                return [INITIAL_MESSAGE];
            }
        });

    const messagesEndRef =
        useRef(null);

    const typingTimerRef =
        useRef(null);

    const quickQuestions =
        useMemo(
            () => [
                'Browse events',
                'How do I book an event?',
                'Where is my ticket?',
                'Payment help',
                'Cancellation policy',
                'How do refunds work?',
                'Download invoice',
                'Contact support'
            ],
            []
        );

    useEffect(() => {
        localStorage.setItem(
            CHAT_STORAGE_KEY,
            JSON.stringify(messages)
        );
    }, [messages]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        messagesEndRef.current?.scrollIntoView(
            {
                behavior: 'smooth'
            }
        );
    }, [
        messages,
        isTyping,
        isOpen
    ]);

    useEffect(() => {
        return () => {
            if (
                typingTimerRef.current
            ) {
                clearTimeout(
                    typingTimerRef.current
                );
            }
        };
    }, []);

    const getBotResponse = (
        rawMessage
    ) => {
        const message =
            normalizeText(rawMessage);

        if (!message) {
            return {
                text:
                    'Please type a question so I can help you.',
                suggestions:
                    quickQuestions.slice(
                        0,
                        3
                    )
            };
        }

        if (
            includesAny(message, [
                'hello',
                'hi',
                'hey',
                'good morning',
                'good afternoon',
                'good evening'
            ])
        ) {
            return {
                text:
                    'Hello! How can I help you with EventiQ today?',
                suggestions: [
                    'Browse events',
                    'Booking help',
                    'Payment help'
                ]
            };
        }

        if (
            includesAny(message, [
                'browse event',
                'find event',
                'show event',
                'available event',
                'upcoming event',
                'all event',
                'explore event'
            ])
        ) {
            return {
                text:
                    'You can browse all available events on the Events page. Use the event cards to view full details before booking.',
                action: {
                    label:
                        'Browse Events',
                    path: '/events'
                },
                suggestions: [
                    'How do I book an event?',
                    'Can I book multiple tickets?'
                ]
            };
        }

        if (
            includesAny(message, [
                'book an event',
                'book event',
                'booking process',
                'how to book',
                'buy ticket',
                'purchase ticket'
            ])
        ) {
            return {
                text:
                    'To book an event: open the Events page, select an event, choose the required ticket quantity, continue with the booking, provide your address details and complete payment when applicable. Your booking request will then appear in your dashboard.',
                action: {
                    label:
                        'Browse Events',
                    path: '/events'
                },
                suggestions: [
                    'Can I book multiple tickets?',
                    'Where can I see my booking?'
                ]
            };
        }

        if (
            includesAny(message, [
                'multiple ticket',
                'more than one ticket',
                'ticket quantity',
                'quantity',
                'qty',
                'several tickets'
            ])
        ) {
            return {
                text:
                    'Yes. When the quantity option is available on the event booking page, you can select the number of tickets required before continuing. The total amount is calculated using the event price and selected quantity.',
                suggestions: [
                    'How do I book an event?',
                    'How is the total calculated?'
                ]
            };
        }

        if (
            includesAny(message, [
                'total calculated',
                'total price',
                'booking amount',
                'ticket price',
                'price calculation'
            ])
        ) {
            return {
                text:
                    'The booking total is calculated by multiplying the event ticket price by the selected ticket quantity. Any applicable payment information is displayed before you complete the transaction.',
                suggestions: [
                    'Payment help',
                    'Can I book multiple tickets?'
                ]
            };
        }

        if (
            includesAny(message, [
                'my booking',
                'booking status',
                'see booking',
                'view booking',
                'booking history',
                'where is booking'
            ])
        ) {
            return {
                text:
                    'Open your user dashboard and select My Bookings. Your bookings are grouped according to their current status, such as pending, confirmed or cancelled.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Where is my ticket?',
                    'Cancellation policy'
                ]
            };
        }

        if (
            includesAny(message, [
                'pending booking',
                'booking pending',
                'awaiting approval',
                'admin approval',
                'not approved'
            ])
        ) {
            return {
                text:
                    'A pending booking is waiting for admin review. Once it is approved, its updated status will appear in your dashboard. For an approved booking, the ticket will be made available according to the booking workflow.',
                action: {
                    label:
                        'Check Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Where is my ticket?',
                    'Ticket is delayed'
                ]
            };
        }

        if (
            includesAny(message, [
                'where is my ticket',
                'view ticket',
                'download ticket',
                'ticket missing',
                'receive ticket',
                'get ticket'
            ])
        ) {
            return {
                text:
                    'After an eligible booking is approved, open My Bookings in your dashboard and use the View Ticket option. The ticket page also provides the available PDF download option.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Ticket is delayed',
                    'Download invoice'
                ]
            };
        }

        if (
            includesAny(message, [
                'ticket delayed',
                'delayed ticket',
                'ticket not received',
                'no ticket',
                'waiting for ticket'
            ])
        ) {
            return {
                text:
                    'If an eligible approved booking still has no ticket, use the “Ticket delayed? Contact support” option shown for that booking. EventiQ will open a support form with the relevant booking information.',
                action: {
                    label:
                        'Check Bookings',
                    path: '/dashboard'
                },
                suggestions: [
                    'Contact support',
                    'Where is my ticket?'
                ]
            };
        }

        if (
            includesAny(message, [
                'payment help',
                'make payment',
                'pay for booking',
                'payment process',
                'payment pending'
            ])
        ) {
            return {
                text:
                    'For a paid event, complete payment from the booking flow after entering the required details. Once the transaction is completed, the payment and booking status can be reviewed from your dashboard and Payment History.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Payment failed',
                    'Payment history'
                ]
            };
        }

        if (
            includesAny(message, [
                'payment failed',
                'failed payment',
                'payment error',
                'transaction failed',
                'money deducted'
            ])
        ) {
            return {
                text:
                    'If payment fails, first verify whether the transaction appears in your payment provider or bank account. Do not repeatedly pay for the same pending attempt. Check your dashboard and contact EventiQ support with the booking and payment details if the issue continues.',
                action: {
                    label:
                        'Contact Support',
                    path: '/contact-us'
                },
                suggestions: [
                    'Payment history',
                    'Contact support'
                ]
            };
        }

        if (
            includesAny(message, [
                'payment history',
                'transaction history',
                'past payment',
                'see payment',
                'paid booking'
            ])
        ) {
            return {
                text:
                    'Your payment-related booking records are available in the Payment History section of the user dashboard. Applicable invoice, ticket-delay and refund-delay options are also displayed there.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Download invoice',
                    'How do refunds work?'
                ]
            };
        }

        if (
            includesAny(message, [
                'invoice',
                'download invoice',
                'view invoice',
                'payment receipt',
                'receipt'
            ])
        ) {
            return {
                text:
                    'For an eligible paid booking, use the View or Download Invoice option shown in My Bookings or Payment History. The invoice contains the relevant event, booking and payment information.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Payment history',
                    'Where is my ticket?'
                ]
            };
        }

        if (
            includesAny(message, [
                'cancel booking',
                'cancel event',
                'cancellation',
                'cancellation policy',
                'can i cancel'
            ])
        ) {
            return {
                text:
                    'Cancellation availability depends on the booking’s current state and EventiQ’s refund policy. Open the applicable booking in your dashboard and use the cancellation option when it is available. Review the refund policy before confirming.',
                action: {
                    label:
                        'View Refund Policy',
                    path:
                        '/refund-policy'
                },
                suggestions: [
                    'How do refunds work?',
                    'Open my bookings'
                ]
            };
        }

        if (
            includesAny(message, [
                'refund',
                'refund process',
                'how refund works',
                'money back',
                'refunded'
            ])
        ) {
            return {
                text:
                    'For a paid booking that is cancelled and eligible for a refund, the refund status is shown in your dashboard. It may indicate that refund initiation is pending, the refund has been initiated, or the refund has been completed.',
                action: {
                    label:
                        'Open Dashboard',
                    path: '/dashboard'
                },
                suggestions: [
                    'Refund is delayed',
                    'View refund policy'
                ]
            };
        }

        if (
            includesAny(message, [
                'refund delayed',
                'delayed refund',
                'refund not received',
                'waiting for refund',
                'refund pending'
            ])
        ) {
            return {
                text:
                    'When an initiated refund is taking longer than expected, use the “Refund delayed? Contact support” option shown for the applicable cancelled paid booking. The support page will include the related booking details.',
                action: {
                    label:
                        'Check Refund Status',
                    path: '/dashboard'
                },
                suggestions: [
                    'Contact support',
                    'How do refunds work?'
                ]
            };
        }

        if (
            includesAny(message, [
                'refund policy',
                'refund rules',
                'eligible for refund',
                'refund eligibility'
            ])
        ) {
            return {
                text:
                    'You can review EventiQ’s cancellation and refund information on the Refund Policy page. Refund eligibility may depend on the booking, payment and cancellation status.',
                action: {
                    label:
                        'View Refund Policy',
                    path:
                        '/refund-policy'
                },
                suggestions: [
                    'Cancellation policy',
                    'How do refunds work?'
                ]
            };
        }

        if (
            includesAny(message, [
                'wishlist',
                'saved event',
                'favourite event',
                'favorite event',
                'save event'
            ])
        ) {
            return {
                text:
                    'Use the heart button on an event card to add or remove it from your wishlist. Your saved events can be viewed from the Wishlist page.',
                action: {
                    label:
                        'Open Wishlist',
                    path: '/wishlist'
                },
                suggestions: [
                    'Browse events',
                    'How do I book an event?'
                ]
            };
        }

        if (
            includesAny(message, [
                'login',
                'sign in',
                'cannot login',
                'log in'
            ])
        ) {
            return {
                text:
                    'Use the Login page to access your EventiQ account. Make sure you enter the same email address and password used during registration.',
                action: {
                    label: 'Login',
                    path: '/login'
                },
                suggestions: [
                    'How do I register?',
                    'Contact support'
                ]
            };
        }

        if (
            includesAny(message, [
                'register',
                'create account',
                'sign up',
                'new account'
            ])
        ) {
            return {
                text:
                    'Open the Sign Up page, enter the required account information and complete the verification process. You can then log in and start booking events.',
                action: {
                    label:
                        'Create Account',
                    path: '/register'
                },
                suggestions: [
                    'How do I book an event?',
                    'Login help'
                ]
            };
        }

        if (
            includesAny(message, [
                'contact support',
                'customer support',
                'need help',
                'contact eventiq',
                'support team',
                'complaint'
            ])
        ) {
            return {
                text:
                    'You can contact the EventiQ support team from the Contact Us page. For ticket-delay or refund-delay issues, use the dedicated support button attached to the applicable booking so the booking details are included automatically.',
                action: {
                    label:
                        'Contact Support',
                    path: '/contact-us'
                },
                suggestions: [
                    'Ticket is delayed',
                    'Refund is delayed'
                ]
            };
        }

        if (
            includesAny(message, [
                'faq',
                'frequently asked',
                'common question'
            ])
        ) {
            return {
                text:
                    'The Frequently Asked Questions page contains additional information about EventiQ and its services.',
                action: {
                    label:
                        'Open FAQs',
                    path: '/faqs'
                },
                suggestions: [
                    'Booking help',
                    'Payment help'
                ]
            };
        }

        if (
            includesAny(message, [
                'about',
                'what is eventiq',
                'eventiq website'
            ])
        ) {
            return {
                text:
                    'EventiQ is an event discovery and booking platform that provides event browsing, booking management, payments, downloadable tickets, invoices, cancellations, refunds, wishlists and customer support.',
                action: {
                    label:
                        'About EventiQ',
                    path: '/about-us'
                },
                suggestions: [
                    'Browse events',
                    'How do I book an event?'
                ]
            };
        }

        if (
            includesAny(message, [
                'thank',
                'thanks',
                'helpful'
            ])
        ) {
            return {
                text:
                    'You are welcome! Let me know what else you would like to know about EventiQ.',
                suggestions:
                    quickQuestions.slice(
                        0,
                        3
                    )
            };
        }

        if (
            includesAny(message, [
                'bye',
                'goodbye',
                'see you'
            ])
        ) {
            return {
                text:
                    'Goodbye! I hope you enjoy using EventiQ.',
                suggestions: [
                    'Browse events',
                    'Open my dashboard'
                ]
            };
        }

        return {
            text:
                'I could not find an exact answer for that. I can currently help with bookings, ticket quantity, payments, tickets, invoices, cancellations, refunds, wishlists and support.',
            suggestions: [
                'Booking help',
                'Payment help',
                'Contact support'
            ]
        };
    };

    const addBotResponse = (
        response
    ) => {
        setIsTyping(true);

        typingTimerRef.current =
            setTimeout(() => {
                setMessages(
                    (
                        currentMessages
                    ) => [
                        ...currentMessages,
                        createMessage(
                            'bot',
                            response.text,
                            {
                                action:
                                    response.action,
                                suggestions:
                                    response.suggestions
                            }
                        )
                    ]
                );

                setIsTyping(false);
            }, 550);
    };

    const sendMessage = (
        messageText
    ) => {
        const trimmedMessage =
            messageText.trim();

        if (
            !trimmedMessage ||
            isTyping
        ) {
            return;
        }

        setMessages(
            (currentMessages) => [
                ...currentMessages,
                createMessage(
                    'user',
                    trimmedMessage
                )
            ]
        );

        setInput('');

        const response =
            getBotResponse(
                trimmedMessage
            );

        addBotResponse(response);
    };

    const handleSubmit = (
        event
    ) => {
        event.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (
        suggestion
    ) => {
        sendMessage(suggestion);
    };

    const handleActionClick = (
        path
    ) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleClearChat = () => {
        if (
            typingTimerRef.current
        ) {
            clearTimeout(
                typingTimerRef.current
            );
        }

        setIsTyping(false);
        setInput('');
        setMessages([
            INITIAL_MESSAGE
        ]);

        localStorage.removeItem(
            CHAT_STORAGE_KEY
        );
    };

    return (
        <>
            {isOpen && (
                <section
                    aria-label="EventiQ support chatbot"
                    className="
                        fixed
                        z-50
                        bottom-24
                        right-4
                        sm:right-6
                        w-[calc(100vw-2rem)]
                        sm:w-[390px]
                        h-[min(620px,calc(100vh-8rem))]
                        overflow-hidden
                        rounded-2xl
                        border
                        border-gray-200
                        dark:border-gray-700
                        bg-white
                        dark:bg-gray-900
                        shadow-2xl
                        flex
                        flex-col
                    "
                >
                    <header
                        className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            px-4
                            py-4
                            bg-gray-900
                            border-b
                            border-gray-800
                        "
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="
                                    w-11
                                    h-11
                                    shrink-0
                                    rounded-full
                                    bg-white
                                    text-gray-900
                                    flex
                                    items-center
                                    justify-center
                                    shadow-sm
                                "
                            >
                                <FaRobot
                                    size={21}
                                />
                            </div>

                            <div className="min-w-0">
                                <h2 className="font-bold text-white leading-tight">
                                    EventiQ
                                    Assistant
                                </h2>

                                <p className="text-xs text-gray-300 flex items-center gap-1.5 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400" />
                                    Online
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={
                                    handleClearChat
                                }
                                aria-label="Clear chatbot conversation"
                                title="Clear chat"
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    text-gray-300
                                    hover:text-white
                                    hover:bg-gray-800
                                    inline-flex
                                    items-center
                                    justify-center
                                "
                            >
                                <FaTrashAlt
                                    size={15}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsOpen(
                                        false
                                    )
                                }
                                aria-label="Close chatbot"
                                title="Close"
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    text-gray-300
                                    hover:text-white
                                    hover:bg-gray-800
                                    inline-flex
                                    items-center
                                    justify-center
                                "
                            >
                                <FaTimes
                                    size={18}
                                />
                            </button>
                        </div>
                    </header>

                    <div
                        className="
                            flex-1
                            overflow-y-auto
                            px-4
                            py-4
                            bg-gray-50
                            dark:bg-gray-950
                        "
                    >
                        <div className="space-y-4">
                            {messages.map(
                                (message) => {
                                    const isBot =
                                        message.sender ===
                                        'bot';

                                    return (
                                        <div
                                            key={
                                                message.id
                                            }
                                            className={`flex items-start gap-2 ${
                                                isBot
                                                    ? 'justify-start'
                                                    : 'justify-end'
                                            }`}
                                        >
                                            {isBot && (
                                                <div
                                                    className="
                                                        w-8
                                                        h-8
                                                        shrink-0
                                                        rounded-full
                                                        bg-gray-900
                                                        text-white
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <FaRobot
                                                        size={
                                                            14
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[82%] ${
                                                    isBot
                                                        ? ''
                                                        : 'flex flex-col items-end'
                                                }`}
                                            >
                                                <div
                                                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                                        isBot
                                                            ? `
                                                                bg-white
                                                                dark:bg-gray-800
                                                                text-gray-800
                                                                dark:text-gray-100
                                                                border
                                                                border-gray-200
                                                                dark:border-gray-700
                                                                rounded-tl-md
                                                            `
                                                            : `
                                                                bg-gray-900
                                                                dark:bg-gray-100
                                                                text-white
                                                                dark:text-gray-900
                                                                rounded-tr-md
                                                            `
                                                    }`}
                                                >
                                                    {
                                                        message.text
                                                    }
                                                </div>

                                                {message.action && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleActionClick(
                                                                message
                                                                    .action
                                                                    .path
                                                            )
                                                        }
                                                        className="
                                                            mt-2
                                                            px-4
                                                            py-2
                                                            rounded-lg
                                                            border
                                                            border-gray-900
                                                            dark:border-gray-200
                                                            text-gray-900
                                                            dark:text-gray-100
                                                            hover:bg-gray-900
                                                            hover:text-white
                                                            dark:hover:bg-gray-100
                                                            dark:hover:text-gray-900
                                                            text-sm
                                                            font-semibold
                                                        "
                                                    >
                                                        {
                                                            message
                                                                .action
                                                                .label
                                                        }
                                                    </button>
                                                )}

                                                {isBot &&
                                                    Array.isArray(
                                                        message.suggestions
                                                    ) &&
                                                    message
                                                        .suggestions
                                                        .length >
                                                        0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {message.suggestions.map(
                                                                (
                                                                    suggestion
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            suggestion
                                                                        }
                                                                        type="button"
                                                                        disabled={
                                                                            isTyping
                                                                        }
                                                                        onClick={() =>
                                                                            handleSuggestionClick(
                                                                                suggestion
                                                                            )
                                                                        }
                                                                        className="
                                                                            text-left
                                                                            px-3
                                                                            py-1.5
                                                                            rounded-full
                                                                            border
                                                                            border-gray-300
                                                                            dark:border-gray-600
                                                                            bg-white
                                                                            dark:bg-gray-900
                                                                            text-gray-700
                                                                            dark:text-gray-200
                                                                            hover:border-gray-900
                                                                            dark:hover:border-gray-300
                                                                            hover:text-gray-900
                                                                            dark:hover:text-white
                                                                            text-xs
                                                                            disabled:opacity-50
                                                                            disabled:cursor-not-allowed
                                                                        "
                                                                    >
                                                                        {
                                                                            suggestion
                                                                        }
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>

                                            {!isBot && (
                                                <div
                                                    className="
                                                        w-8
                                                        h-8
                                                        shrink-0
                                                        rounded-full
                                                        bg-gray-200
                                                        dark:bg-gray-700
                                                        text-gray-700
                                                        dark:text-gray-100
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <FaUser
                                                        size={
                                                            13
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}

                            {isTyping && (
                                <div className="flex items-start gap-2">
                                    <div
                                        className="
                                            w-8
                                            h-8
                                            shrink-0
                                            rounded-full
                                            bg-gray-900
                                            text-white
                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        <FaRobot
                                            size={14}
                                        />
                                    </div>

                                    <div
                                        className="
                                            bg-white
                                            dark:bg-gray-800
                                            border
                                            border-gray-200
                                            dark:border-gray-700
                                            rounded-2xl
                                            rounded-tl-md
                                            px-4
                                            py-3
                                            shadow-sm
                                        "
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />

                                            <span
                                                className="
                                                    w-2
                                                    h-2
                                                    rounded-full
                                                    bg-gray-400
                                                    animate-bounce
                                                "
                                                style={{
                                                    animationDelay:
                                                        '120ms'
                                                }}
                                            />

                                            <span
                                                className="
                                                    w-2
                                                    h-2
                                                    rounded-full
                                                    bg-gray-400
                                                    animate-bounce
                                                "
                                                style={{
                                                    animationDelay:
                                                        '240ms'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div
                                ref={
                                    messagesEndRef
                                }
                            />
                        </div>
                    </div>

                    <div
                        className="
                            border-t
                            border-gray-200
                            dark:border-gray-700
                            bg-white
                            dark:bg-gray-900
                            p-3
                        "
                    >
                        {messages.length ===
                            1 && (
                            <div className="flex gap-2 overflow-x-auto pb-3">
                                {quickQuestions
                                    .slice(0, 4)
                                    .map(
                                        (
                                            question
                                        ) => (
                                            <button
                                                key={
                                                    question
                                                }
                                                type="button"
                                                onClick={() =>
                                                    handleSuggestionClick(
                                                        question
                                                    )
                                                }
                                                className="
                                                    shrink-0
                                                    px-3
                                                    py-1.5
                                                    rounded-full
                                                    border
                                                    border-gray-300
                                                    dark:border-gray-600
                                                    text-xs
                                                    text-gray-700
                                                    dark:text-gray-200
                                                    hover:border-gray-900
                                                    dark:hover:border-gray-300
                                                "
                                            >
                                                {
                                                    question
                                                }
                                            </button>
                                        )
                                    )}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="flex items-end gap-2"
                        >
                            <label
                                htmlFor="eventiq-chat-input"
                                className="sr-only"
                            >
                                Ask the
                                EventiQ
                                assistant
                            </label>

                            <textarea
                                id="eventiq-chat-input"
                                value={input}
                                onChange={(
                                    event
                                ) =>
                                    setInput(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                            'Enter' &&
                                        !event.shiftKey
                                    ) {
                                        event.preventDefault();
                                        handleSubmit(
                                            event
                                        );
                                    }
                                }}
                                rows={1}
                                maxLength={300}
                                placeholder="Ask about bookings, tickets or refunds..."
                                className="
                                    flex-1
                                    min-h-[44px]
                                    max-h-28
                                    resize-none
                                    rounded-xl
                                    border
                                    border-gray-300
                                    dark:border-gray-600
                                    bg-gray-50
                                    dark:bg-gray-800
                                    text-gray-900
                                    dark:text-white
                                    placeholder:text-gray-500
                                    px-3
                                    py-2.5
                                    text-sm
                                    outline-none
                                    focus:ring-2
                                    focus:ring-gray-900
                                    dark:focus:ring-gray-300
                                "
                            />

                            <button
                                type="submit"
                                disabled={
                                    !input.trim() ||
                                    isTyping
                                }
                                aria-label="Send message"
                                title="Send"
                                className="
                                    w-11
                                    h-11
                                    shrink-0
                                    rounded-xl
                                    bg-gray-900
                                    hover:bg-gray-700
                                    dark:bg-gray-100
                                    dark:hover:bg-white
                                    text-white
                                    dark:text-gray-900
                                    inline-flex
                                    items-center
                                    justify-center
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                "
                            >
                                <FaPaperPlane
                                    size={16}
                                />
                            </button>
                        </form>

                        <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-2">
                            Automated EventiQ
                            help assistant
                        </p>
                    </div>
                </section>
            )}

            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (current) =>
                            !current
                    )
                }
                aria-label={
                    isOpen
                        ? 'Close EventiQ chatbot'
                        : 'Open EventiQ chatbot'
                }
                title={
                    isOpen
                        ? 'Close assistant'
                        : 'Chat with EventiQ'
                }
                className="
                    fixed
                    z-50
                    bottom-5
                    right-4
                    sm:right-6
                    w-14
                    h-14
                    rounded-full
                    bg-gray-900
                    hover:bg-gray-700
                    dark:bg-gray-100
                    dark:hover:bg-white
                    text-white
                    dark:text-gray-900
                    shadow-xl
                    hover:shadow-2xl
                    hover:scale-105
                    active:scale-95
                    inline-flex
                    items-center
                    justify-center
                    border
                    border-gray-700
                    dark:border-gray-300
                "
            >
                {isOpen ? (
                    <FaTimes
                        size={22}
                    />
                ) : (
                    <FaComments
                        size={23}
                    />
                )}
            </button>
        </>
    );
};

export default EventiQChatbot;