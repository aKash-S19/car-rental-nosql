# Car Rental Operations Manager

A simple car rental management system with React frontend and Node.js backend.

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Start MongoDB

```bash
net start MongoDB
```

### 3. Run the Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## Features

- ✅ User Registration & Login
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ MongoDB Integration
- ✅ Responsive Design
- ✅ Role-based Access (admin, manager, employee)

## Technology Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Database

- **MongoDB**: localhost:27017
- **Database**: car-rental
- **Collection**: users

## Features

- **Landing Page**: Professional homepage showcasing system features
- **Authentication**: User registration and login functionality
- **Fleet Management**: Track and manage vehicle inventory
- **Booking System**: Handle rental reservations
- **Customer Records**: Manage customer database
- **Payment Processing**: Handle transactions and billing
- **Multi-Location Support**: Distributed location management
- **Real-time Analytics**: Dashboard with insights and reports

## Technology Stack

### Frontend

- React 18 (JavaScript)
- React Router DOM
- Axios for API calls
- CSS3 with responsive design
- No TypeScript dependencies

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- CORS enabled
- Express Validator

## Project Structure

```
car-rental-manager/
├── client/                 # React frontend (JavaScript)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.js
│   │   │   ├── LandingPage.css
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   └── Auth.css
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/
│   │   ├── User.js
│   │   └── Car.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cars.js
│   │   ├── bookings.js
│   │   └── customers.js
│   ├── index.js
│   ├── .env
│   ├── .env.example
│   └── package.json
├── package.json           # Root package.json
├── README.md
└── MONGODB_SETUP.md       # MongoDB setup guide
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd car-rental-manager
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   npm run install-server

   # Install client dependencies
   npm run install-client
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `server` directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/car-rental
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**

   Make sure MongoDB is running on your system:

   ```bash
   # For local MongoDB installation
   mongod

   # Or use MongoDB Atlas cloud service
   ```

5. **Run the Application**

   **Development Mode (both frontend and backend):**

   ```bash
   npm run dev
   ```

   **Or run separately:**

   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Cars

- `GET /api/cars` - Get all cars
- `GET /api/cars/available` - Get available cars

### Bookings

- `GET /api/bookings` - Get all bookings (placeholder)

### Customers

- `GET /api/customers` - Get all customers (placeholder)

## User Roles

- **Employee**: Basic access to view and create rentals
- **Manager**: Enhanced access to manage inventory and reports
- **Admin**: Full system access and user management

## Database Schema

### User Model

- name (String, required)
- email (String, required, unique)
- password (String, required, hashed)
- role (String, enum: admin/manager/employee)
- phone (String)
- isActive (Boolean)
- timestamps

### Car Model

- make, model, year (required)
- licensePlate (String, unique)
- color, category (required)
- dailyRate (Number)
- status (enum: available/rented/maintenance/retired)
- mileage, location (required)
- features, images (arrays)
- timestamps

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- CORS configuration
- Environment variable protection

## Development

### Available Scripts

```bash
npm run dev          # Run both frontend and backend
npm run server       # Run backend only
npm run client       # Run frontend only
npm run build        # Build frontend for production
npm start            # Start production server
npm run install-all  # Install all dependencies
```

### Future Enhancements

- Dashboard with analytics
- Booking management system
- Payment integration
- Real-time notifications
- Mobile application
- Advanced reporting
- Integration with external APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@rentcarpro.com or create an issue in the repository.
