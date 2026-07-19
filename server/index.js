const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const supportRoutes = require('./routes/support');
const wishlistRoutes = require('./routes/wishlist');
const newsletterRoutes = require(
    './routes/newsletter'
);

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                allowedOrigins.includes(origin)
            ) {
                callback(null, true);
                return;
            }

            callback(
                new Error(
                    'Not allowed by CORS'
                )
            );
        },

        credentials: true
    })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use(
    '/api/newsletter',
    newsletterRoutes
);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');

        app.listen(PORT, () => {
            console.log(
                `Server is running on port ${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            'MongoDB connection error:',
            error.message
        );
    });