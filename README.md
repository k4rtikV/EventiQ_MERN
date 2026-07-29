# 🎟️ EventiQ

A full-stack MERN Event Management and Ticket Booking Platform built with modern web technologies. EventiQ allows users to discover events, book tickets, complete secure online payments, receive digital tickets and invoices, while giving administrators powerful tools to manage bookings, refunds, newsletters and event operations.

---

Deployed link - https://eventiq-mern.onrender.com/

Example:

- Home Page
- Event Details
- User Dashboard
- Admin Dashboard
- Ticket Preview
- Payment Flow

---

# ✨ Features

## 👤 User Features

- User Registration & Login
- Email Verification using OTP
- Secure JWT Authentication
- Forgot Password & Reset Password
- Browse Upcoming Events
- Search & Filter Events
- Wishlist
- Event Booking
- Quantity-based Ticket Booking
- Secure Razorpay Payment Integration
- Booking Cancellation
- Refund Status Tracking
- Download Tickets
- Download Invoices
- Ticket QR Code
- Notification Centre
- AI-inspired Help Chatbot
- Dark / Light Theme
- Responsive Design

---

## 🛠 Admin Features

- Secure Admin Login
- Protected Admin Routes
- Dashboard Analytics
- Create Events
- Edit Events
- Delete Events
- View Booking Requests
- Approve Bookings
- Reject Bookings
- View Paid Clients
- Successful Bookings Management
- Refund Management
- Delayed Ticket Support
- Newsletter Management
- Notification Broadcasting

---

## 📧 Email System

Professional HTML emails powered by **Brevo API**.

Includes:

- Registration OTP
- Password Reset OTP
- Booking Request Confirmation
- Booking Approved
- Ticket Delivery
- Refund Initiated
- Newsletter Emails

---

## 💳 Payments

- Razorpay Integration
- Online Payment Verification
- Invoice Generation
- Payment History
- Refund Tracking

---

## 🎫 Ticket System

Each approved booking generates:

- Digital Ticket
- QR Code
- Downloadable PDF Ticket
- Invoice PDF

---

## 🤖 Smart Chatbot

Built-in chatbot capable of assisting users with:

- Booking help
- Refund information
- Payment questions
- Ticket support
- Navigation assistance
- Frequently Asked Questions

---

# 🧰 Tech Stack

## Frontend

- React
- Vite
- React Router
- Axios
- Context API
- Tailwind CSS
- React Icons

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Brevo Email API
- Razorpay
- PDFKit
- QRCode

---

# 📂 Project Structure

```
EventiQ
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── package.json
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/EventiQ.git
```

```bash
cd EventiQ
```

---

## Install Dependencies

### Root

```bash
npm install
```

### Client

```bash
cd client
npm install
```

### Server

```bash
cd server
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the **server** directory.

Example:

```env
PORT=5000

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

BREVO_API_KEY=YOUR_BREVO_API_KEY
EMAIL_FROM_NAME=EventiQ
EMAIL_FROM_ADDRESS=YOUR_VERIFIED_EMAIL
SUPPORT_EMAIL=YOUR_SUPPORT_EMAIL

RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
```

---

# ▶️ Run the Project

Start Backend

```bash
cd server
npm run dev
```

Start Frontend

```bash
cd client
npm run dev
```

---

# 🧪 Test Payment

Use Razorpay Test Mode.

### Card Details

| Field | Value |
|--------|-------|
| Card Number | **6073 8400 0000 0016** |
| Expiry | Any future date |
| CVV | Any 3 digits |
| Name | Any Name |
| OTP | **123456** |

---

# 🔐 Security Features

- JWT Authentication
- Protected User Routes
- Protected Admin Routes
- Role-based Authorization
- Secure Payment Verification
- Password Hashing
- Input Validation
- OTP Expiry
- Email Verification
- Duplicate Booking Protection

---

# 📱 Responsive Design

Optimized for:

- Desktop
- Laptop
- Tablet
- Mobile

---

# Future Improvements

- Organizer Portal
- QR Attendance Scanning
- WhatsApp Ticket Delivery
- Google Calendar Integration
- Event Reviews & Ratings
- AI Chatbot with LLM Integration
- Event Recommendations

---

# 👨‍💻 Author

**Kartik Varma**

GitHub:
https://github.com/k4rtikV

---

# 📜 License

This project is developed for educational and portfolio purposes.