# Car Rental Operations Manager

A comprehensive full-stack car rental management system with role-based access control for admins and customers.

## 🚀 Features

### ✅ 1. User Authentication & Account Handling Module

This module controls how users enter the system and manage their identity. It supports new user registration, secure login, and session/token validation.

**Core Features:**

- Signup with email, phone, and password
- Login using encrypted credentials
- Generate authentication tokens (JWT)
- Store user role → Customer / Admin
- Profile update options (name, contact, license number)
- Document verification workflow
- Loyalty points system

### ✅ 2. Vehicle Management & Fleet Catalog Module

This module acts as the central storage for all vehicle-related information. Admins can expand or modify the fleet, while customers can view available cars.

**Core Features:**

- Add/update/delete car entries (Admin only)
- Store specs → brand, model, transmission, price-per-day, seating, fuel, images
- Track car availability status (Available / Booked / Maintenance)
- Search & filter (brand, type, price, fuel, etc.)
- Multi-branch vehicle assignments
- Real-time availability tracking

### ✅ 3. Booking & Rental Coordination Module

This module manages the entire flow of reserving a vehicle and returning it. It ensures no double-booking and maintains a clear timeline of rental events.

**Core Features:**

- Create new booking request
- Check date and time availability
- Prevent overlapping bookings
- Admin approval workflow
- Automatic price calculation
- Update car status when user picks up or returns
- Cancel or modify upcoming bookings
- Maintain complete rental history for every user
- Loyalty points on completion

### ✅ 4. Issue Reporting & Support Module

This module allows users to raise complaints or report problems related to cars or service.

**Core Features:**

- Users can report issues during or after rental
- Attach text descriptions and set priority levels
- Admin can view, respond, and update issue status
- Issue status tracking (Open, In Progress, Resolved)
- Maintain history of all reports
- Helps improve service quality and car maintenance decisions

### ✅ 5. Enhanced Features

- **Notifications System** - Real-time alerts for all booking and issue events
- **Admin Dashboard** - Comprehensive analytics with statistics and charts
- **Audit Logging** - Track all admin actions for security monitoring
- **Multi-Branch Support** - Manage multiple rental locations

## 🛠️ Technology Stack

**Frontend:**

- React 18.2.0
- React Router DOM 6.16.0
- Axios 1.5.1

**Backend:**

- Node.js with Express 5.1.0
- MongoDB with Mongoose 8.18.1
- JWT 9.0.2 for authentication
- bcryptjs 3.0.2 for password encryption

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aravind
```

### 2. Install Dependencies

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
cd client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/car_rental
PORT=5000
JWT_SECRET=<generate-a-strong-random-secret>
```

**Note:** Replace `<generate-a-strong-random-secret>` with a strong random string. Never commit the `.env` file to version control.

### 4. Start MongoDB

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 5. Run the Application

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Default Credentials

You can create accounts through the signup page with roles:

- **Admin** - Full system access
- **Customer** - Booking and issue management

## 📊 Database Collections

- **users** - User accounts with profiles and documents
- **cars** - Vehicle fleet catalog
- **bookings** - Rental reservations and history
- **issues** - Support tickets and complaints
- **notifications** - User notification queue
- **auditlogs** - Admin action tracking
- **branches** - Rental location management

## 🎯 Key Routes

**Public Routes:**

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/vehicles` - Browse available cars

**Protected Routes:**

- `/dashboard` - Role-based dashboard
- `/book/:carId` - Book a specific vehicle
- `/my-bookings` - View booking history
- `/my-issues` - View reported issues
- `/profile` - User profile management

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Audit logging for admin actions
- Document verification workflow

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop browsers
- Tablets
- Mobile devices

---

**Built with ❤️ for efficient car rental management**
