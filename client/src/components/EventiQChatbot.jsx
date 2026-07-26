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

import api from '../utils/axios';
import { getChatbotResponse } from '../utils/chatbotEngine';

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

const CHAT_STATE_STORAGE_KEY =
    'eventiq-chatbot-conversation-state';

const EVENT_CATEGORY_STATE =
    'waiting-for-event-category';

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

    const [availableCategories, setAvailableCategories] =
        useState([]);

    const [categoriesLoading, setCategoriesLoading] =
        useState(true);

    const [conversationState, setConversationState] =
        useState(() =>
            localStorage.getItem(
                CHAT_STATE_STORAGE_KEY
            ) || null
        );

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
                'Suggest events',
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
        if (conversationState) {
            localStorage.setItem(
                CHAT_STATE_STORAGE_KEY,
                conversationState
            );
        } else {
            localStorage.removeItem(
                CHAT_STATE_STORAGE_KEY
            );
        }
    }, [conversationState]);

    useEffect(() => {
        let isMounted = true;

        const fetchEventCategories = async () => {
            try {
                setCategoriesLoading(true);

                const { data } = await api.get('/events');
                const events = Array.isArray(data) ? data : [];

                const categories = Array.from(
                    new Set(
                        events
                            .map((event) => event.category?.trim())
                            .filter(Boolean)
                    )
                ).sort((firstCategory, secondCategory) =>
                    firstCategory.localeCompare(secondCategory)
                );

                if (isMounted) {
                    setAvailableCategories(categories);
                }
            } catch (error) {
                console.error(
                    'Could not load chatbot event categories:',
                    error
                );

                if (isMounted) {
                    setAvailableCategories([]);
                }
            } finally {
                if (isMounted) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchEventCategories();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const getBotResponse = (rawMessage) =>
        getChatbotResponse({
            rawMessage,
            conversationState,
            availableCategories,
            categoriesLoading,
            quickQuestions
        });

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

        if (
            Object.prototype.hasOwnProperty.call(
                response,
                'nextConversationState'
            )
        ) {
            setConversationState(
                response.nextConversationState
            );
        }

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
        setConversationState(null);

        localStorage.removeItem(
            CHAT_STORAGE_KEY
        );
        localStorage.removeItem(
            CHAT_STATE_STORAGE_KEY
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