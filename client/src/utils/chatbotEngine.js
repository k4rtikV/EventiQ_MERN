const EVENT_CATEGORY_STATE = 'waiting-for-event-category';

export const normalizeChatbotText = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/\b(q\.r\.|q r)\b/g, 'qr')
        .replace(/\bqty\b/g, 'quantity')
        .replace(/\btix\b/g, 'ticket')
        .replace(/\bcancelled\b/g, 'canceled')
        .replace(/\bfavourite\b/g, 'favorite')
        .replace(/[^\w\s₹-]/g, ' ')
        .replace(/\s+/g, ' ');

const SYNONYMS = {
    qr: ['barcode', 'scan code', 'scanner code', 'entry code'],
    ticket: ['entry pass', 'event pass', 'admission pass'],
    booking: ['reservation', 'registration', 'order'],
    payment: ['transaction', 'checkout', 'paying'],
    refund: ['money back', 'return payment', 'repayment'],
    canceled: ['cancelled', 'called off'],
    delayed: ['late', 'taking long', 'not arrived', 'still waiting'],
    invoice: ['receipt', 'bill'],
    notification: ['alert', 'update', 'bell'],
    login: ['sign in', 'log in'],
    register: ['sign up', 'create account']
};

const expandSynonyms = (message) => {
    let expanded = message;

    Object.entries(SYNONYMS).forEach(([canonical, alternatives]) => {
        alternatives.forEach((alternative) => {
            if (message.includes(alternative)) {
                expanded += ` ${canonical}`;
            }
        });
    });

    return expanded;
};

const includesAny = (text, values = []) =>
    values.some((value) => text.includes(normalizeChatbotText(value)));

const tokenize = (text) =>
    new Set(
        text
            .split(' ')
            .map((token) => token.trim())
            .filter((token) => token.length > 1)
    );

const levenshteinDistance = (left = '', right = '') => {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;

    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        const current = [leftIndex];

        for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
            const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
            current[rightIndex] = Math.min(
                current[rightIndex - 1] + 1,
                previous[rightIndex] + 1,
                previous[rightIndex - 1] + cost
            );
        }

        previous.splice(0, previous.length, ...current);
    }

    return previous[right.length];
};

const hasFuzzyToken = (tokens, target) => {
    const normalizedTarget = normalizeChatbotText(target);
    if (tokens.has(normalizedTarget)) return true;
    if (normalizedTarget.includes(' ')) return false;
    if (normalizedTarget.length < 5) return false;

    return [...tokens].some((token) => {
        if (Math.abs(token.length - normalizedTarget.length) > 1) return false;
        return levenshteinDistance(token, normalizedTarget) <= 1;
    });
};

const INTENTS = [
    {
        id: 'greeting',
        examples: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'hello bot'],
        keywords: ['hello', 'hi', 'hey'],
        response: {
            text: 'Hello! How can I help you with EventiQ today?',
            suggestions: ['Browse events', 'Booking help', 'Payment help']
        }
    },
    {
        id: 'browse-events',
        examples: ['browse events', 'find events', 'show me events', 'available events', 'upcoming events', 'all events', 'explore events', 'what events are available'],
        phrases: ['browse event', 'find event', 'show event', 'available event', 'upcoming event', 'all event', 'explore event'],
        keywords: ['events', 'browse', 'available', 'upcoming'],
        response: {
            text: 'You can browse all available events on the Events page. Open an event card to review its date, venue, price and other details before booking.',
            action: { label: 'Browse Events', path: '/events' },
            suggestions: ['How do I book an event?', 'Can I book multiple tickets?']
        }
    },
    {
        id: 'booking-process',
        examples: ['how do i book an event', 'how can i book an event', 'book an event', 'booking process', 'how to book', 'buy a ticket', 'purchase a ticket', 'steps to book an event', 'i want to attend an event'],
        phrases: ['book an event', 'book event', 'booking process', 'how to book', 'buy ticket', 'purchase ticket'],
        keywords: ['book', 'booking', 'ticket', 'attend'],
        response: {
            text: 'To book an event, open the Events page, select an event, choose the required ticket quantity, continue with the booking, provide your address details and complete payment when applicable. Your booking request will then appear in your dashboard.',
            action: { label: 'Browse Events', path: '/events' },
            suggestions: ['Can I book multiple tickets?', 'Where can I see my booking?']
        }
    },
    {
        id: 'ticket-quantity',
        examples: ['can i book multiple tickets', 'can i buy more than one ticket', 'how many tickets can i book', 'ticket quantity', 'select quantity', 'book several tickets', 'book tickets for friends', 'can one booking admit three people'],
        phrases: ['multiple ticket', 'more than one ticket', 'ticket quantity', 'several ticket', 'book tickets for'],
        keywords: ['quantity', 'multiple', 'tickets', 'people', 'friends'],
        response: {
            text: 'Yes. When quantity selection is available, choose the number of attendees before continuing. EventiQ creates one booking and one ticket showing “Admits: X”, where X is the selected quantity.',
            suggestions: ['What does Admits mean?', 'How is the total calculated?', 'How do I book an event?']
        }
    },
    {
        id: 'admits-meaning',
        examples: ['what does admits mean', 'what is admits 3', 'why does my ticket say admits', 'does admits 3 allow three people', 'one qr for multiple people', 'how does admits work'],
        phrases: ['what does admits', 'ticket say admits', 'admits 3', 'admits work'],
        keywords: ['admits', 'people', 'quantity'],
        response: {
            text: '“Admits: X” shows how many attendees are covered by that booking. For example, “Admits: 3” means the ticket permits entry for three people together under the same booking and QR code.',
            suggestions: ['Will my ticket have a QR code?', 'Can I book multiple tickets?', 'Where is my ticket?']
        }
    },
    {
        id: 'price-calculation',
        examples: ['how is the total calculated', 'what is the total price', 'booking amount', 'ticket price calculation', 'why did price increase with quantity', 'cost for multiple tickets'],
        phrases: ['total calculated', 'total price', 'booking amount', 'ticket price', 'price calculation'],
        keywords: ['total', 'price', 'amount', 'cost', 'quantity'],
        response: {
            text: 'The booking total is the event ticket price multiplied by the selected ticket quantity. Any discount and the final amount are displayed before payment.',
            suggestions: ['Payment help', 'Can I book multiple tickets?']
        }
    },
    {
        id: 'booking-status',
        examples: ['where can i see my booking', 'my booking', 'booking status', 'view booking', 'booking history', 'where is my reservation', 'check my booking'],
        phrases: ['my booking', 'booking status', 'see booking', 'view booking', 'booking history', 'where is booking'],
        keywords: ['booking', 'status', 'history', 'dashboard'],
        response: {
            text: 'Open your user dashboard and select My Bookings. Your bookings are grouped by status, including pending, confirmed and cancelled.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Where is my ticket?', 'Cancellation policy']
        }
    },
    {
        id: 'booking-pending',
        examples: ['why is my booking pending', 'booking pending', 'awaiting approval', 'waiting for admin approval', 'booking not approved', 'how long does approval take'],
        phrases: ['pending booking', 'booking pending', 'awaiting approval', 'admin approval', 'not approved'],
        keywords: ['pending', 'approval', 'admin', 'waiting'],
        response: {
            text: 'A pending booking is waiting for admin review. Once it is approved or rejected, the updated status will appear in your dashboard and Notification Centre.',
            action: { label: 'Check Dashboard', path: '/dashboard' },
            suggestions: ['Where is my ticket?', 'Where are my notifications?', 'Ticket is delayed']
        }
    },
    {
        id: 'ticket-qr',
        examples: ['will my ticket have a qr code', 'does my ticket contain a qr', 'is there a qr on my ticket', 'does the ticket have a barcode', 'what gets scanned at entry', 'how will they verify my ticket', 'can security scan my ticket', 'is the qr generated automatically', 'do i show a code at the gate', 'how does ticket verification work'],
        phrases: ['qr code', 'ticket qr', 'ticket have a qr', 'ticket contain a qr', 'ticket have a barcode', 'scan my ticket', 'scanned at entry', 'verify my ticket'],
        keywords: ['qr', 'barcode', 'scan', 'verification', 'gate', 'entry'],
        requiredAny: ['qr', 'barcode', 'scan', 'verification'],
        response: {
            text: 'Yes. Once your booking is approved, your EventiQ ticket contains a QR code used for verification at the event. For a quantity booking, the same ticket also displays the number of attendees as “Admits: X”.',
            suggestions: ['Where is my ticket?', 'How do I download my ticket?', 'What does Admits mean?']
        }
    },
    {
        id: 'ticket-location',
        examples: ['where is my ticket', 'how do i view my ticket', 'download my ticket', 'ticket is missing', 'when will i receive my ticket', 'how do i get my ticket', 'where is the ticket pdf'],
        phrases: ['where is my ticket', 'view ticket', 'download ticket', 'ticket missing', 'receive ticket', 'get ticket'],
        keywords: ['ticket', 'view', 'download', 'missing', 'receive'],
        response: {
            text: 'After an eligible booking is approved, open My Bookings in your dashboard and select View Ticket. The ticket page also includes the PDF download option.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Ticket is delayed', 'Will my ticket have a QR code?', 'Download invoice']
        }
    },
    {
        id: 'ticket-download-problem',
        examples: ['ticket pdf will not download', 'cannot download my ticket', 'download ticket button not working', 'ticket download failed', 'pdf is not opening'],
        phrases: ['cannot download ticket', 'ticket download failed', 'download button not working', 'pdf not opening'],
        keywords: ['ticket', 'download', 'pdf', 'failed', 'working'],
        response: {
            text: 'First open the approved booking and use View Ticket before selecting Download PDF. If the ticket page opens but the download fails, refresh the page and try again. Contact support if the issue continues.',
            action: { label: 'Check Bookings', path: '/dashboard' },
            suggestions: ['Where is my ticket?', 'Contact support']
        }
    },
    {
        id: 'ticket-delayed',
        examples: ['my ticket is delayed', 'ticket not received', 'i have no ticket', 'waiting for my ticket', 'approved but ticket missing', 'paid but no ticket', 'ticket still not available'],
        phrases: ['ticket delayed', 'delayed ticket', 'ticket not received', 'no ticket', 'waiting for ticket', 'paid but no ticket'],
        keywords: ['ticket', 'delayed', 'waiting', 'missing', 'approved'],
        response: {
            text: 'If an eligible approved booking still has no ticket, use the “Ticket delayed? Contact support” option shown for that booking. EventiQ will open a support form with the booking information filled in automatically.',
            action: { label: 'Check Bookings', path: '/dashboard' },
            suggestions: ['Contact support', 'Where is my ticket?']
        }
    },
    {
        id: 'payment-process',
        examples: ['payment help', 'how do i make payment', 'pay for booking', 'payment process', 'where do i pay', 'complete payment', 'payment pending'],
        phrases: ['payment help', 'make payment', 'pay for booking', 'payment process', 'payment pending'],
        keywords: ['payment', 'pay', 'checkout', 'pending'],
        response: {
            text: 'For a paid event, complete payment from the booking flow after entering the required details. Your payment and booking status can then be reviewed from the dashboard and Payment History.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Payment failed', 'Money was deducted', 'Payment history']
        }
    },
    {
        id: 'money-deducted',
        examples: ['money was deducted but booking says unpaid', 'amount deducted but payment failed', 'i was charged but booking is pending', 'bank debited but no confirmation', 'paid but status is unpaid', 'transaction successful but booking not updated'],
        phrases: ['money deducted', 'amount deducted', 'charged but', 'debited but', 'paid but status', 'booking says unpaid'],
        keywords: ['deducted', 'charged', 'debited', 'unpaid', 'payment', 'booking'],
        response: {
            text: 'This may be a payment-status mismatch. Do not pay again immediately. Check Payment History and your bank or payment-provider record, then contact support with the booking ID and transaction details if EventiQ still shows the booking as unpaid.',
            action: { label: 'Contact Support', path: '/contact-us' },
            suggestions: ['Payment history', 'Contact support', 'Why is my booking pending?']
        }
    },
    {
        id: 'payment-failed',
        examples: ['payment failed', 'transaction failed', 'payment error', 'razorpay failed', 'payment did not go through', 'checkout closed', 'unable to complete payment'],
        phrases: ['payment failed', 'failed payment', 'payment error', 'transaction failed', 'did not go through'],
        keywords: ['payment', 'failed', 'error', 'transaction', 'checkout'],
        response: {
            text: 'If payment fails, verify whether money was deducted before trying again. Avoid repeated payments for the same pending attempt. Check your dashboard and contact EventiQ support if the issue continues.',
            action: { label: 'Contact Support', path: '/contact-us' },
            suggestions: ['Money was deducted', 'Payment history', 'Contact support']
        }
    },
    {
        id: 'payment-history',
        examples: ['where is payment history', 'show transaction history', 'past payments', 'see my payments', 'paid bookings history', 'payment records'],
        phrases: ['payment history', 'transaction history', 'past payment', 'see payment', 'paid booking'],
        keywords: ['payment', 'history', 'transaction', 'records'],
        response: {
            text: 'Your payment-related booking records are available in Payment History on the user dashboard. Applicable invoice, ticket-delay and refund-delay actions are also shown there.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Download invoice', 'How do refunds work?']
        }
    },
    {
        id: 'invoice',
        examples: ['how do i download invoice', 'view invoice', 'where is my receipt', 'payment receipt', 'download bill', 'invoice is missing'],
        phrases: ['download invoice', 'view invoice', 'payment receipt', 'invoice missing'],
        keywords: ['invoice', 'receipt', 'bill', 'download'],
        response: {
            text: 'For an eligible paid booking, use View or Download Invoice in My Bookings or Payment History. The invoice contains the event, booking and payment details.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Payment history', 'Where is my ticket?']
        }
    },
    {
        id: 'cancellation',
        examples: ['how do i cancel a booking', 'cancel booking', 'can i cancel my event', 'cancellation policy', 'remove my booking', 'i no longer want to attend'],
        phrases: ['cancel booking', 'cancel event', 'cancellation', 'cancellation policy', 'can i cancel'],
        keywords: ['cancel', 'cancellation', 'booking', 'attend'],
        response: {
            text: 'Cancellation availability depends on the booking’s current state and EventiQ’s refund policy. Open the applicable booking in your dashboard and use Cancel Booking when it is available.',
            action: { label: 'View Refund Policy', path: '/refund-policy' },
            suggestions: ['How do refunds work?', 'Open my bookings']
        }
    },
    {
        id: 'refund-process',
        examples: ['how do refunds work', 'refund process', 'when will i get money back', 'refund status', 'how is a canceled paid booking refunded', 'what happens after cancellation'],
        phrases: ['refund process', 'how refund works', 'money back', 'refund status'],
        keywords: ['refund', 'money', 'canceled', 'status'],
        response: {
            text: 'For an eligible cancelled paid booking, your dashboard shows whether the refund is awaiting initiation, has been initiated, or has been completed.',
            action: { label: 'Open Dashboard', path: '/dashboard' },
            suggestions: ['Refund is delayed', 'View refund policy']
        }
    },
    {
        id: 'refund-delayed',
        examples: ['refund is delayed', 'refund not received', 'still waiting for refund', 'refund pending too long', 'initiated refund has not arrived', 'where is my money back'],
        phrases: ['refund delayed', 'delayed refund', 'refund not received', 'waiting for refund', 'refund pending'],
        keywords: ['refund', 'delayed', 'waiting', 'pending', 'received'],
        response: {
            text: 'When an initiated refund is taking longer than expected, use “Refund delayed? Contact support” on the applicable cancelled paid booking. The support form will include the related booking details.',
            action: { label: 'Check Refund Status', path: '/dashboard' },
            suggestions: ['Contact support', 'How do refunds work?']
        }
    },
    {
        id: 'refund-policy',
        examples: ['show refund policy', 'refund rules', 'am i eligible for refund', 'refund eligibility', 'what are the cancellation rules'],
        phrases: ['refund policy', 'refund rules', 'eligible for refund', 'refund eligibility'],
        keywords: ['refund', 'policy', 'rules', 'eligible'],
        response: {
            text: 'EventiQ’s cancellation and refund information is available on the Refund Policy page. Eligibility can depend on the booking, payment and cancellation status.',
            action: { label: 'View Refund Policy', path: '/refund-policy' },
            suggestions: ['Cancellation policy', 'How do refunds work?']
        }
    },
    {
        id: 'wishlist',
        examples: ['how does wishlist work', 'save an event', 'favorite event', 'where are saved events', 'remove from wishlist', 'heart button'],
        phrases: ['wishlist', 'saved event', 'favorite event', 'save event'],
        keywords: ['wishlist', 'saved', 'favorite', 'heart'],
        response: {
            text: 'Use the heart button on an event card to add or remove it from your wishlist. Your saved events are available on the Wishlist page.',
            action: { label: 'Open Wishlist', path: '/wishlist' },
            suggestions: ['Browse events', 'How do I book an event?']
        }
    },
    {
        id: 'notifications',
        examples: ['where are my notifications', 'how do i open notification centre', 'what is the bell icon', 'show my alerts', 'where can i see booking updates', 'how do notifications work'],
        phrases: ['notification centre', 'where are my notifications', 'bell icon', 'booking updates'],
        keywords: ['notification', 'alerts', 'bell', 'updates'],
        response: {
            text: 'Use the bell icon in the navigation bar to view recent EventiQ updates. Select View All Notifications for the complete Notification Centre, where you can open, read or remove notifications.',
            action: { label: 'Open Notifications', path: '/notifications' },
            suggestions: ['Why did I receive a notification?', 'How do I mark notifications as read?', 'Booking status']
        }
    },
    {
        id: 'notification-read',
        examples: ['mark notification as read', 'clear unread notifications', 'remove notification badge', 'why is the bell count showing', 'delete a notification'],
        phrases: ['mark notification as read', 'unread notification', 'remove notification badge', 'delete notification'],
        keywords: ['notification', 'read', 'unread', 'delete', 'badge'],
        response: {
            text: 'Opening an unread notification marks it as read. In the Notification Centre, you can also mark all notifications as read or delete individual notifications.',
            action: { label: 'Open Notifications', path: '/notifications' },
            suggestions: ['Where are my notifications?', 'Notification link is not working']
        }
    },
    {
        id: 'notification-link',
        examples: ['notification link is not working', 'notification opens wrong page', 'nothing happens when i click alert', 'cannot open notification'],
        phrases: ['notification link not working', 'cannot open notification', 'notification opens wrong'],
        keywords: ['notification', 'link', 'open', 'working'],
        response: {
            text: 'Try opening the Notification Centre and selecting the notification again. If its related booking or event no longer exists, the link may not have a destination. Contact support if an active notification repeatedly opens the wrong page.',
            action: { label: 'Open Notifications', path: '/notifications' },
            suggestions: ['Contact support', 'Where are my notifications?']
        }
    },
    {
        id: 'login',
        examples: ['how do i login', 'sign in', 'cannot login', 'login not working', 'where is login page', 'access my account'],
        phrases: ['cannot login', 'login help', 'sign in', 'log in'],
        keywords: ['login', 'account', 'password'],
        response: {
            text: 'Use the Login page to access your EventiQ account. Enter the same email address and password used during registration.',
            action: { label: 'Login', path: '/login' },
            suggestions: ['How do I register?', 'Contact support']
        }
    },
    {
        id: 'register',
        examples: ['how do i register', 'create an account', 'sign up', 'new account', 'join eventiq', 'registration process'],
        phrases: ['create account', 'sign up', 'new account', 'registration process'],
        keywords: ['register', 'account', 'signup'],
        response: {
            text: 'Open the Sign Up page, enter the required account information and complete verification. You can then log in and start booking events.',
            action: { label: 'Create Account', path: '/register' },
            suggestions: ['How do I book an event?', 'Login help']
        }
    },
    {
        id: 'otp',
        examples: ['otp not received', 'verification code did not arrive', 'wrong otp', 'otp expired', 'cannot verify account', 'resend otp'],
        phrases: ['otp not received', 'wrong otp', 'otp expired', 'verification code'],
        keywords: ['otp', 'verification', 'code', 'expired', 'resend'],
        response: {
            text: 'Check that the email address is correct and review the spam or junk folder. Use the available resend option if the OTP expires or does not arrive. Contact support if verification repeatedly fails.',
            action: { label: 'Contact Support', path: '/contact-us' },
            suggestions: ['Login help', 'How do I register?']
        }
    },
    {
        id: 'support',
        examples: ['contact support', 'customer support', 'i need help', 'contact eventiq', 'support team', 'submit a complaint', 'talk to someone'],
        phrases: ['contact support', 'customer support', 'need help', 'contact eventiq', 'support team'],
        keywords: ['support', 'help', 'complaint', 'contact'],
        response: {
            text: 'Use the Contact Us page for general help. For ticket-delay or refund-delay problems, use the dedicated support button on the applicable booking so EventiQ can include its details automatically.',
            action: { label: 'Contact Support', path: '/contact-us' },
            suggestions: ['Ticket is delayed', 'Refund is delayed']
        }
    },
    {
        id: 'faq',
        examples: ['open faq', 'frequently asked questions', 'common questions', 'help articles'],
        phrases: ['frequently asked', 'common question', 'open faq'],
        keywords: ['faq', 'questions', 'help'],
        response: {
            text: 'The Frequently Asked Questions page contains additional information about EventiQ and its services.',
            action: { label: 'Open FAQs', path: '/faqs' },
            suggestions: ['Booking help', 'Payment help']
        }
    },
    {
        id: 'about',
        examples: ['what is eventiq', 'tell me about eventiq', 'what does this website do', 'about the platform'],
        phrases: ['what is eventiq', 'eventiq website', 'about eventiq'],
        keywords: ['eventiq', 'about', 'platform'],
        response: {
            text: 'EventiQ is an event discovery and booking platform with booking management, payments, downloadable tickets, invoices, cancellations, refunds, wishlists, notifications and customer support.',
            action: { label: 'About EventiQ', path: '/about-us' },
            suggestions: ['Browse events', 'How do I book an event?']
        }
    },
    {
        id: 'thanks',
        examples: ['thank you', 'thanks', 'that was helpful', 'great thanks', 'appreciate it'],
        phrases: ['thank you', 'that was helpful', 'appreciate it'],
        keywords: ['thanks', 'thank', 'helpful'],
        response: {
            text: 'You are welcome! Let me know what else you would like to know about EventiQ.',
            suggestions: ['Browse events', 'Booking help', 'Payment help']
        }
    },
    {
        id: 'goodbye',
        examples: ['bye', 'goodbye', 'see you', 'that is all', 'close chat'],
        phrases: ['goodbye', 'see you', 'that is all'],
        keywords: ['bye'],
        response: {
            text: 'Goodbye! I hope you enjoy using EventiQ.',
            suggestions: ['Browse events', 'Open my dashboard']
        }
    }
];

const scoreIntent = (message, tokens, intent) => {
    let score = 0;

    (intent.examples || []).forEach((example) => {
        const normalizedExample = normalizeChatbotText(example);
        if (message === normalizedExample) score += 14;
        else if (message.includes(normalizedExample)) score += 8;
    });

    (intent.phrases || []).forEach((phrase) => {
        if (message.includes(normalizeChatbotText(phrase))) score += 6;
    });

    (intent.keywords || []).forEach((keyword) => {
        const normalizedKeyword = normalizeChatbotText(keyword);
        if (message.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 3 : 2;
        else if (hasFuzzyToken(tokens, normalizedKeyword)) score += 1;
    });

    if (intent.requiredAny && !includesAny(message, intent.requiredAny)) {
        score -= 6;
    }

    (intent.negative || []).forEach((negative) => {
        if (message.includes(normalizeChatbotText(negative))) score -= 5;
    });

    return score;
};

const findBestIntent = (message) => {
    const tokens = tokenize(message);

    return INTENTS
        .map((intent) => ({ intent, score: scoreIntent(message, tokens, intent) }))
        .sort((left, right) => right.score - left.score)[0];
};

const detectBroadTopic = (message) => {
    const topics = [
        { name: 'ticket', words: ['ticket', 'qr', 'barcode', 'scan', 'entry pass'] },
        { name: 'payment', words: ['payment', 'transaction', 'paid', 'charged', 'deducted', 'bank'] },
        { name: 'refund', words: ['refund', 'money back', 'repayment'] },
        { name: 'booking', words: ['booking', 'reservation', 'book event'] },
        { name: 'notification', words: ['notification', 'alert', 'bell', 'update'] },
        { name: 'account', words: ['login', 'register', 'account', 'otp', 'password'] },
        { name: 'support', words: ['support', 'complaint', 'help'] }
    ];

    return topics.find((topic) => includesAny(message, topic.words))?.name || null;
};

const topicClarification = (topic) => {
    const clarifications = {
        ticket: {
            text: 'It sounds like your question is about a ticket. Which issue best matches what you need?',
            suggestions: ['Where is my ticket?', 'Will my ticket have a QR code?', 'Cannot download my ticket', 'Ticket is delayed']
        },
        payment: {
            text: 'It sounds like your question is about a payment. What happened?',
            suggestions: ['How do I make payment?', 'Payment failed', 'Money was deducted', 'Payment history']
        },
        refund: {
            text: 'It sounds like your question is about a refund. Which status or issue are you checking?',
            suggestions: ['How do refunds work?', 'Refund is delayed', 'View refund policy']
        },
        booking: {
            text: 'It sounds like your question is about a booking. What would you like to do?',
            suggestions: ['How do I book an event?', 'Booking status', 'Cancel booking', 'Can I book multiple tickets?']
        },
        notification: {
            text: 'It sounds like your question is about the Notification Centre. What do you need help with?',
            suggestions: ['Where are my notifications?', 'Mark notification as read', 'Notification link is not working']
        },
        account: {
            text: 'It sounds like your question is about your account. Which issue best matches?',
            suggestions: ['Login help', 'How do I register?', 'OTP not received', 'Contact support']
        },
        support: {
            text: 'I can help direct you to the right support option. What kind of issue are you facing?',
            suggestions: ['Ticket is delayed', 'Refund is delayed', 'Payment failed', 'Contact support']
        }
    };

    return clarifications[topic];
};

export const getChatbotResponse = ({
    rawMessage,
    conversationState,
    availableCategories = [],
    categoriesLoading = false,
    quickQuestions = []
}) => {
    const message = expandSynonyms(normalizeChatbotText(rawMessage));

    const createCategorySuggestions = () => [
        ...availableCategories,
        'Browse all events',
        'Cancel recommendation'
    ];

    const findMatchingCategory = () =>
        availableCategories.find((category) =>
            message.includes(normalizeChatbotText(category))
        );

    const createCategoryResult = (category) => ({
        text: `Great choice! I found the ${category} category. Use the button below to view matching events.`,
        action: {
            label: `View ${category} Events`,
            path: `/events?category=${encodeURIComponent(category)}`
        },
        suggestions: ['Suggest another category', 'How do I book an event?'],
        nextConversationState: null
    });

    if (!message) {
        return {
            text: 'Please type a question so I can help you.',
            suggestions: quickQuestions.slice(0, 3)
        };
    }

    if (conversationState === EVENT_CATEGORY_STATE) {
        if (includesAny(message, ['cancel', 'never mind', 'nevermind', 'stop recommendation', 'cancel recommendation'])) {
            return {
                text: 'No problem. I have cancelled the event recommendation. What else can I help you with?',
                suggestions: quickQuestions.slice(0, 4),
                nextConversationState: null
            };
        }

        if (includesAny(message, ['all', 'any category', 'browse all', 'all events', 'no preference'])) {
            return {
                text: 'Sure! You can browse every available event on the Events page.',
                action: { label: 'Browse All Events', path: '/events' },
                suggestions: ['How do I book an event?', 'Can I book multiple tickets?'],
                nextConversationState: null
            };
        }

        const selectedCategory = findMatchingCategory();
        if (selectedCategory) return createCategoryResult(selectedCategory);

        if (categoriesLoading) {
            return {
                text: 'I am still loading the latest event categories. Please try again in a moment.',
                suggestions: ['Suggest events'],
                nextConversationState: EVENT_CATEGORY_STATE
            };
        }

        if (availableCategories.length === 0) {
            return {
                text: 'I could not load the event categories right now. You can still browse all available events.',
                action: { label: 'Browse Events', path: '/events' },
                suggestions: ['Try event suggestions again'],
                nextConversationState: null
            };
        }

        return {
            text: 'I could not match that to an available category. Please select or type one of the categories below.',
            suggestions: createCategorySuggestions(),
            nextConversationState: EVENT_CATEGORY_STATE
        };
    }

    const directCategory = findMatchingCategory();
    if (directCategory && includesAny(message, ['event', 'recommend', 'suggest', 'show', 'find', 'browse'])) {
        return createCategoryResult(directCategory);
    }

    if (includesAny(message, [
        'suggest event', 'recommend event', 'event recommendation', 'help me find an event',
        'help me choose an event', 'what event should i attend', 'which event should i attend',
        'show events by category', 'find me an event', 'find me events',
        'suggest another category', 'try event suggestions again'
    ])) {
        if (categoriesLoading) {
            return {
                text: 'I am loading the latest event categories. Please try again in a moment.',
                suggestions: ['Suggest events'],
                nextConversationState: EVENT_CATEGORY_STATE
            };
        }

        if (availableCategories.length === 0) {
            return {
                text: 'I could not load the available categories right now, but you can still browse all events.',
                action: { label: 'Browse Events', path: '/events' },
                suggestions: ['Try event suggestions again'],
                nextConversationState: null
            };
        }

        return {
            text: 'Sure! What type of event are you interested in? Select a category below or type its name.',
            suggestions: createCategorySuggestions(),
            nextConversationState: EVENT_CATEGORY_STATE
        };
    }

    if (
        includesAny(message, ['money deducted', 'money was deducted', 'amount deducted', 'charged but', 'debited but']) &&
        includesAny(message, ['unpaid', 'failed', 'pending', 'not updated', 'no confirmation', 'booking'])
    ) {
        return INTENTS.find((intent) => intent.id === 'money-deducted').response;
    }

    const bestMatch = findBestIntent(message);
    if (bestMatch && bestMatch.score >= 6) {
        return bestMatch.intent.response;
    }

    const broadTopic = detectBroadTopic(message);
    if (broadTopic) return topicClarification(broadTopic);

    if (bestMatch && bestMatch.score >= 3) {
        const likelyTopic = detectBroadTopic(
            `${message} ${(bestMatch.intent.keywords || []).join(' ')}`
        );
        if (likelyTopic) return topicClarification(likelyTopic);
    }

    return {
        text: 'I am not completely sure which part of EventiQ you mean. Is this about a booking, payment, ticket, refund, account, notification or support request?',
        suggestions: ['Booking issue', 'Payment issue', 'Ticket issue', 'Refund issue', 'Notifications', 'Contact support']
    };
};

export { EVENT_CATEGORY_STATE };