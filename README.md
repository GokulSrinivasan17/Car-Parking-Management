# 🚗 ParkSmart — Smart Car & Bike Parking Management System (MERN Stack)

**ParkSmart** is a production-ready, full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for intelligent multi-level parking facility management. It features real-time slot telemetry, interactive bay dispatching, live duration timers, dynamic fare calculations with overtime monitoring, and instant printable digital tax receipts.

---

## 📑 Table of Contents
1. [🌟 System Overview](#-system-overview)
2. [🛠️ Tech Stack](#️-tech-stack)
3. [📂 File Structure & Architecture](#-file-structure--architecture)
4. [⚡ Key Features & Capabilities](#-key-features--capabilities)
5. [💰 Parking Tariff Matrix](#-parking-tariff-matrix)
6. [🚀 Installation & Setup Guide](#-installation--setup-guide)
7. [🔑 Default Demo Credentials](#-default-demo-credentials)
8. [📡 API Documentation & Endpoints](#-api-documentation--endpoints)
9. [📱 User & Admin Workflow](#-user--admin-workflow)

---

## 🌟 System Overview

ParkSmart solves traditional urban parking challenges by providing:
- **Driver Portal**: Seamless slot discovery across multi-level floors and zones, 1-click booking requests, live digital parking passes with ticking stay timers, and printable exit tax receipts.
- **Facility Manager Console**: Executive analytics dashboard, instant booking approvals/rejections with reason notes, live occupancy telemetry, full parking bay CRUD management, and complete transaction audit logs.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **React.js 19**: Modern component architecture with hooks and Context API.
- **Tailwind CSS 3.4**: Responsive UI styling with custom glassmorphism, glowing shadows, and animations.
- **Framer Motion**: Smooth page transitions, modal dialogs, and animated micro-interactions.
- **Lucide React**: Clean vector icon suite.
- **Axios**: HTTP client configured with JWT authorization interceptors.
- **React Router DOM v6**: Declarative client-side routing with role-based protected routes.

### Backend (`server/`)
- **Node.js & Express.js**: RESTful API backend architecture.
- **MongoDB & Mongoose**: Object Data Modeling (ODM) for users, parking slots, and booking sessions.
- **JSON Web Tokens (JWT)**: Stateless token-based user & admin authentication.
- **bcryptjs**: Secure password hashing with salt generation.
- **dotenv**: Environment variable configuration.
- **cors**: Cross-Origin Resource Sharing middleware.

---

## 📂 File Structure & Architecture

```
carparking/
├── README.md                          # Single master project documentation
├── package.json                       # Root package with concurrent dev scripts
├── package-lock.json                  # Root dependency lockfile
│
├── server/                            # Backend REST API server
│   ├── config/
│   │   └── db.js                      # MongoDB connection handler
│   ├── controllers/
│   │   ├── authController.js          # User registration & login controller
│   │   ├── bookingController.js       # Reservations, approval, checkout & revenue stats
│   │   └── slotController.js          # Parking slot CRUD controller
│   ├── middleware/
│   │   └── authMiddleware.js          # JWT protection & Admin authorization middleware
│   ├── models/
│   │   ├── Booking.js                 # Booking schema (slots, vehicle, rates, status)
│   │   ├── ParkingSlot.js             # Parking bay schema (floor, zone, vehicle type, status)
│   │   └── User.js                    # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── authRoutes.js              # Auth endpoints (/api/auth)
│   │   ├── bookingRoutes.js           # Booking management endpoints (/api/bookings)
│   │   └── slotRoutes.js              # Parking bay endpoints (/api/slots)
│   ├── createAdmin.js                 # Seed script to initialize default admin account
│   ├── seedSlots.js                   # Seed script to populate 50 multi-level slots
│   ├── index.js                       # Express application entry point
│   ├── package.json                   # Backend dependencies & scripts
│   └── package-lock.json              # Backend lockfile
│
└── client/                            # Frontend React application
    ├── public/
    │   ├── favicon.ico                # App icon
    │   ├── index.html                 # HTML template with Google Fonts & metadata
    │   ├── manifest.json              # Web app manifest
    │   └── robots.txt                 # Search engine crawling rules
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Footer.jsx         # Site footer with tariffs, links & sensor status
    │   │   │   ├── Modal.jsx          # Reusable animated accessible modal dialog
    │   │   │   ├── Navbar.jsx         # Header with active indicators & responsive drawer
    │   │   │   ├── ProtectedRoute.jsx # Route guard for logged-in and admin-only pages
    │   │   │   ├── StatCard.jsx       # Analytical metric cards with glowing gradients
    │   │   │   └── Toast.jsx          # Floating alert notification component
    │   │   └── parking/
    │   │       ├── BookingModal.jsx   # Slot booking dialog with stay slider & cost estimator
    │   │       ├── LiveParkingPass.jsx# Active parking pass with live ticking stay timer
    │   │       ├── ReceiptModal.jsx   # Digital tax invoice receipt with print layout
    │   │       └── SlotCard.jsx       # Interactive parking bay visual component
    │   ├── context/
    │   │   ├── AuthContext.jsx        # Authentication state (login, register, logout, JWT)
    │   │   └── ToastContext.jsx       # Global toast notification provider
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx     # Facility Manager Control Center & Revenue Analytics
    │   │   ├── BookingPage.jsx        # Multi-level slot reservation & interactive bay map
    │   │   ├── Dashboard.jsx          # Driver Dashboard with active passes & invoice history
    │   │   ├── Home.jsx               # Landing page with live lot preview, tariffs & FAQs
    │   │   ├── Login.jsx              # Login page with 1-click Demo credentials
    │   │   ├── NotFound.jsx           # Custom 404 error page
    │   │   ├── ParkedSlots.jsx        # Live vehicle occupancy board with timers
    │   │   └── Register.jsx           # Driver registration page
    │   ├── utils/
    │   │   ├── api.js                 # Axios instance configured with JWT bearer header
    │   │   └── helpers.js             # Currency, date, live stay & fare calculation helpers
    │   ├── App.js                     # Root React routing & layout container
    │   ├── index.css                  # Tailwind directives, glassmorphic utilities & scrollbar
    │   └── index.js                   # React DOM render entry point
    ├── postcss.config.js              # PostCSS configuration
    ├── tailwind.config.js             # Tailwind design tokens, colors & custom shadows
    ├── package.json                   # Frontend dependencies & scripts
    └── package-lock.json              # Frontend lockfile
```

---

## ⚡ Key Features & Capabilities

### 1. Interactive Multi-Level Parking Grid
- Floor selection tabs (**Floor 1**, **Floor 2**) with real-time zone filtering (**Zone A**, **Zone B**, **Zone C**).
- Slot type segmentation for **Cars** (Four-Wheelers) and **Bikes** (Two-Wheelers).
- Real-time status indicators (**Available**, **Occupied**, **Maintenance**).

### 2. Live Stay Duration Ticker & Dynamic Billing
- Active passes update every second with a real-time elapsed timer (`0h 15m 32s`).
- Dynamic accrued fare calculator reflecting base rate + additional hourly stay.
- Automatic overtime warnings if vehicle stays beyond requested duration.

### 3. Digital Ticket & Printable Tax Invoice
- Generated unique ticket numbers (e.g. `TKT1725...`) with simulated barcode visuals.
- Printable tax invoice receipt detailing entry time, exit time, total duration, rate breakdown, and paid status.

### 4. Executive Admin Control Room
- Key analytics: **Total Revenue**, **Today's Revenue**, **Occupancy Rate %**, and **Active Vehicles**.
- Pending approval queue: 1-click **Approve & Check-In** and **Reject** with custom or preset reason tags.
- Slot Management: Add new bays, toggle maintenance mode, or delete slots.
- Transaction logs: Searchable audit trail across all completed and cancelled bookings.

### 5. Seamless UI/UX Design
- Glassmorphism, subtle background blurs, animated hover effects, and custom scrollbars.
- In-app toast notification system replacing browser popups.
- 1-Click Demo Buttons on the Login page for instant testing.

---

## 💰 Parking Tariff Matrix

| Vehicle Type | Base Fare (1st Day) | Daily Rate (After 1st Day) | Dedicated Zones |
| :--- | :--- | :--- | :--- |
| **🚗 Four-Wheeler (Car)** | **₹50** | **+₹10 / day** | Floors 1 & 2 (Zones A & B) |
| **🏍️ Two-Wheeler (Bike)** | **₹20** | **+₹5 / day** | Floors 1 & 2 (Zone C) |

> *Note: Duration is rounded up to the nearest day upon checkout.*

---

## 🚀 Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance running at `mongodb://localhost:27017` or MongoDB Atlas URI)
- Git & npm

### Step 1: Install Dependencies
From the project root:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```
*(Or simply run `npm run install-all` from the root)*

---

### Step 2: Configure Environment Variables
Inside the `server/` directory, create or verify `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/carparking
JWT_SECRET=your_super_secret_jwt_key_12345
```

---

### Step 3: Seed Database Slots & Create Admin Account
Run the database seed scripts:
```bash
# Populate 50 parking bays (25 Car slots & 25 Bike slots across Floor 1 & 2)
cd server
npm run seed

# Create or verify the default Admin account
node createAdmin.js
cd ..
```

---

### Step 4: Run the Application
You can run both client and server concurrently from the root directory:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1 (Backend Server - Port 5000)
cd server
npm run dev

# Terminal 2 (React Client - Port 3000)
cd client
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@carparking.com` | `admin123` | Full Facility Manager Console |
| **User (Driver)** | *Register any new account or use 1-Click Demo* | *Your password* | Driver Dashboard & Slot Booking |

---

## 📡 API Documentation & Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new driver account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |

### 🅿️ Parking Slots (`/api/slots`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/slots` | Public | Get all parking slots and live statuses |
| `POST` | `/api/slots` | Admin | Create a new parking slot |
| `PUT` | `/api/slots/:id` | Admin | Update slot status (e.g. Maintenance) |
| `DELETE` | `/api/slots/:id` | Admin | Delete a parking slot |

### 📋 Bookings & Revenue (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Private | Submit a slot reservation request |
| `GET` | `/api/bookings` | Admin | Get all bookings history across all users |
| `GET` | `/api/bookings/mybookings` | Private | Get logged-in user's bookings |
| `GET` | `/api/bookings/pending` | Admin | Get pending booking requests awaiting approval |
| `GET` | `/api/bookings/active` | Private | Get all currently parked vehicles |
| `GET` | `/api/bookings/stats` | Admin | Get revenue & booking aggregate statistics |
| `PUT` | `/api/bookings/:id/approve` | Admin | Approve pending booking & assign bay |
| `PUT` | `/api/bookings/:id/reject` | Admin | Reject pending booking with reason note |
| `PUT` | `/api/bookings/:id/cancel` | Private | Cancel user's own pending booking request |
| `PUT` | `/api/bookings/:id/end` | Private/Admin | End parking session, calculate final fare & clear bay |

---

## 📱 User & Admin Workflow

```
[Driver]                                           [Facility Admin]
   │                                                      │
   ├─► 1. Browse Multi-Level Bays                         │
   │                                                      │
   ├─► 2. Submit Reservation (Vehicle # & Stay)           │
   │      (Status: Pending)                               │
   │            │                                         │
   │            └────────────────────────────────────────►├─► 3. Review & Approve Request
   │                                                      │      (Slot marked 'Occupied')
   │                                                      │      (Status: Active)
   │◄─────────────────────────────────────────────────────┤
   │                                                      │
   ├─► 4. Live Parking Pass & Ticking Timer               ├─► 5. Monitor Live Vehicles
   │      (Dynamic Fare calculation)                      │      (Overtime alerts)
   │                                                      │
   ├─► 6. Click 'Exit Parking & Pay Bill' ───────────────►├─► 7. End Session & Settle
   │      (Slot released to 'Available')                  │      (Revenue updated)
   │                                                      │
   └─► 8. View / Print Itemized Tax Invoice ◄─────────────┘
```

---

## 📄 License & Attribution
Developed with the **MERN** Stack (MongoDB, Express, React, Node.js). Licensed under the MIT License.
