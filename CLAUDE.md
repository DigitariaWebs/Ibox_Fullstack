# iBox Fullstack Project Documentation

## Project Overview
iBox is a comprehensive transportation and logistics platform similar to Uber for goods/packages. It connects customers who need delivery services with independent transporters.

## Project Structure

```
ibox_fullstack/
├── Ibox/                    # React Native Mobile App (Frontend)
│   ├── src/                # Source code
│   ├── assets/             # Images, fonts, videos
│   └── CLAUDE.md           # Frontend documentation
├── backend/                # Express.js API Server
│   ├── src/                # Source code
│   ├── docker/             # Docker configuration
│   └── CLAUDE.md           # Backend documentation
└── Documentation Files
    ├── CLAUDE.md           # This file - Overall project documentation
    ├── BACKEND_PLAN.md     # Initial backend planning document
    └── *_GUIDE.md          # Various integration guides
```

## Technology Stack

### Frontend (React Native)
- **React Native**: 0.79.5 with Expo 53.0.20
- **TypeScript**: Type-safe development
- **Navigation**: React Navigation v7
- **State Management**: Redux Toolkit with Redux Persist
- **UI**: NativeWind (TailwindCSS), React Native Reanimated
- **Maps**: React Native Maps with Google Maps integration

### Backend (Node.js)
- **Express.js**: v4.21+ with ESM modules
- **MongoDB**: Database with Mongoose ODM v8.17.1
- **Redis**: v5.8.0 for sessions and caching
- **Socket.io**: v4.x for real-time features
- **JWT**: Authentication with access/refresh tokens
- **Docker**: Complete containerization setup

## Current Implementation Status

### ✅ Completed Features

#### Backend (100% Complete)
- Full authentication system with JWT tokens
- User management (Customer/Transporter types)
- Order management system
- File upload handling
- Real-time Socket.io server
- MongoDB with proper schemas
- Redis session management
- Docker development environment
- Complete API documentation

#### Frontend Integration (90% Complete)
- Authentication flow integrated with backend
- SignUp process connected to MongoDB
- Profile management with real user data
- Professional UI components
- iPhone/Android responsive design
- Real-time data fetching

### 🚧 In Progress
- My Orders screen implementation
- Order tracking features
- Payment integration
- Push notifications

## Key Components

### Navigation & UI
- **ProfessionalSidebar**: Clean navigation drawer with 7 core menu items
- **PhoneNumberInput**: Custom phone input with country picker
- **NotificationModal**: Full notification center
- **ServiceSelectionModal**: Service type selector

### Authentication Flow
1. AuthSelectionScreen → LoginModal/SignUp
2. Multi-step registration for new users
3. JWT token management with refresh
4. Secure logout with token cleanup

### Data Flow
- Frontend ↔ Backend API (REST)
- Real-time updates via Socket.io
- Local storage with AsyncStorage
- Redux for global state management

## API Endpoints

### Base URL
- Development: `http://192.168.1.14:5000/api/v1`
- Production: TBD

### Main Endpoints
- `/auth/*` - Authentication (login, register, logout, refresh)
- `/users/*` - User management and profiles
- `/orders/*` - Order creation and tracking
- `/upload/*` - File uploads
- `/notifications/*` - Notification management

## Database Structure

### User Model
- Basic info (name, email, phone)
- User type (customer/transporter)
- Addresses with coordinates
- Transporter-specific details
- Business account support

### Order Model
- Service types (express, standard, moving, storage)
- Pickup/dropoff locations
- Package details and photos
- Real-time tracking
- Payment and rating system

## Development Setup

### Frontend
```bash
cd Ibox
npm install
npm start
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Docker (All Services)
```bash
cd backend
./docker-setup.sh  # One-time setup
./docker-scripts.sh dev start  # Start all services
```

## Recent Updates (2024-12-11)

### UI/UX Improvements
- Created ProfessionalSidebar replacing gradient design
- Optimized for iPhone safe areas and small screens
- Enhanced animations with spring physics
- Fixed sidebar auto-closing issues

## Latest Updates (2025-01-11)

### 🎯 Major Frontend-Backend Integration Complete

#### Address Management System ✅
- **Full CRUD Operations**: Create, read, update, delete addresses with real backend
- **Google Maps Integration**: Worldwide address autocomplete using Places API
- **Professional UI**: Dropdown address types, responsive design, error handling
- **Navigation Architecture**: Full-screen AddAddressScreen instead of nested modals
- **Backend Integration**: Real-time synchronization with MongoDB

#### Authentication Overhaul ✅
- **LoginModal Enhancement**: Added password field with show/hide toggle
- **Keyboard Optimization**: 75% modal height with aggressive KeyboardAvoidingView
- **Real Backend Auth**: JWT token management with proper error handling
- **API Compatibility**: Fixed response structure handling for login/register
- **Token Storage**: Secure AsyncStorage with access/refresh token rotation

#### Loading Screen Redesign ✅
- **Custom Logo Animation**: Progressive color fill from grey to brand colors
- **Minimal Design**: Clean white background, no text or percentages
- **Smooth Animation**: 3-second left-to-right color reveal using Reanimated
- **Professional Appearance**: Centered logo with fade-in effect

#### Backend Fixes ✅
- **API Response Structure**: Fixed login endpoint to match frontend expectations
- **Enhanced Debugging**: Comprehensive error logging for troubleshooting
- **Token Management**: Proper JWT handling with nested response structure
- **Database Operations**: All CRUD operations tested and working
- **Session Management**: Redis integration active for scalable sessions

### Current System Status
- ✅ **Authentication**: Login/Register working with real backend
- ✅ **User Management**: Profile operations integrated
- ✅ **Address System**: Full CRUD with Google Maps API
- ✅ **Database**: MongoDB operations working
- ✅ **Sessions**: Redis caching operational
- ✅ **Security**: JWT tokens, validation, rate limiting active
- 🔄 **Next Phase**: Order management system integration

### Backend Fixes
- Fixed email validation endpoint
- Removed problematic MongoDB indexes
- Improved error handling
- Enhanced rate limiting

### Integration Fixes
- Fixed API response parsing for user data
- Optimized data fetching to prevent re-renders
- Improved token management
- Better error handling in frontend

## Next Steps

1. **Delete old sidebar components** (SidebarMenu.tsx)
2. **Create My Orders screen** with real order data
3. **Implement order tracking** with live updates
4. **Add payment methods** to Settings screen
5. **Complete push notifications** setup

## Important Notes

- Always update CLAUDE.md files when making changes
- Backend runs on port 5000
- MongoDB on port 27017
- Redis on port 6379
- Use proper error handling for all API calls
- Maintain responsive design for all screen sizes

## Team Development Guidelines

1. **Documentation First**: Update CLAUDE.md before implementing
2. **Component Reuse**: Use existing UI components
3. **Type Safety**: Maintain TypeScript types
4. **Error Handling**: Always handle API errors gracefully
5. **Testing**: Test on both iOS and Android
6. **Performance**: Optimize for smooth 60fps animations

---

Last Updated: 2024-12-11