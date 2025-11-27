# Hostello HMS Frontend

A modern React-based frontend for the Hostello Hostel Management System.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Rector, Student)
- Protected routes and automatic redirects
- Password reset with OTP functionality

### 👨‍💼 Admin Dashboard
- **User Management**: Add, search, and manage users
- **Student Management**: Register, update, delete students with full profile management
- **Notification Management**: Send notifications to users/roles with filtering
- **System Settings**: Profile management and security settings
- **Dashboard**: Overview with statistics and quick actions

### 🏠 Rector Dashboard
- **Dashboard**: Real-time overview with student exit management
- **Student Management**: View and manage student information
- **Room Allocation**: Manage room assignments and availability
- **Attendance Management**: Mark attendance and view reports
- **Complaint Management**: Handle student complaints and maintenance requests
- **Notifications**: Send and manage notifications

### 🎓 Student Dashboard
- **Dashboard**: Personal overview and quick actions
- **Profile Management**: View and update personal information
- **Notifications**: View and manage notifications
- **Complaints**: Submit and track complaints

## Technology Stack

- **React 18** with modern hooks and functional components
- **React Router v6** for client-side routing
- **Context API** for state management
- **CSS3** with modern styling and responsive design
- **Vite** for fast development and building
- **ESLint** for code quality

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── pages/             # Page components
│   │   ├── Admin/         # Admin dashboard pages
│   │   ├── Rector/        # Rector dashboard pages
│   │   ├── Student/       # Student dashboard pages
│   │   ├── Login/
│   │   └── RootAdminRegistration/
│   ├── App.jsx            # Main app component
│   └── index.jsx          # Entry point
├── public/                # Static assets
├── package.json
├── vite.config.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 8085

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run both frontend and backend**:
   ```bash
   npm run dev:full
   ```

### Environment Setup

The frontend is configured to proxy API requests to `http://localhost:8085` where the Spring Boot backend should be running.

## API Integration

The frontend communicates with the backend through a comprehensive API service layer (`src/services/api.js`) that includes:

- **Authentication APIs**: Login, logout, token refresh, profile management
- **Admin APIs**: User management, student management, notifications
- **Rector APIs**: Student exit, room management, attendance, complaints
- **Student APIs**: Profile management, notifications, complaints
- **Utility APIs**: Notifications, emergency, audit logs

## Key Features

### 🔒 Security
- JWT token management with automatic refresh
- Role-based route protection
- Secure API communication
- Input validation and error handling

### 📱 Responsive Design
- Mobile-first approach
- Modern UI with gradient backgrounds
- Intuitive navigation
- Loading states and error handling

### 🎨 Modern UI/UX
- Clean, professional design
- Consistent color schemes per role
- Interactive elements with hover effects
- Form validation and user feedback

### ⚡ Performance
- Optimized API calls with parallel requests
- Efficient state management
- Lazy loading and code splitting ready
- Fast development with Vite

## Usage

1. **First Time Setup**: Navigate to the root URL to check if a root admin exists
2. **Root Admin Registration**: If no root admin exists, register one
3. **Login**: Use the registered credentials to log in
4. **Role-based Access**: Access different dashboards based on your role
5. **Full Functionality**: All CRUD operations are available through the intuitive interface

## Development

### Code Style
- ESLint configuration for consistent code style
- Functional components with hooks
- Modern JavaScript (ES6+)
- CSS modules for component styling

### Adding New Features
1. Create API methods in `src/services/api.js`
2. Add components in appropriate page directories
3. Update routing in `App.jsx`
4. Add styling with CSS modules

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend is running on port 8085
2. **Authentication Issues**: Check JWT token storage and refresh logic
3. **API Errors**: Verify API endpoints match backend implementation
4. **Build Errors**: Ensure all dependencies are installed

### Debug Mode
- Check browser console for API errors
- Use React DevTools for component debugging
- Verify network requests in browser dev tools

## Contributing

1. Follow the existing code structure
2. Use meaningful component and variable names
3. Add proper error handling
4. Include loading states for async operations
5. Test all functionality before submitting

## License

This project is part of the Hostello Hostel Management System.