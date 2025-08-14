# iBox Mobile App - Frontend Documentation

## Project Overview
iBox is a smart mobile transportation app built with React Native and Expo that connects customers with independent transporters. It's similar to Uber but focused on goods transport rather than people.

## Project Structure

```
Ibox/
├── App.tsx                 # Main app component with navigation setup
├── package.json           # Dependencies and project configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # TailwindCSS configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
├── global.css             # Global styles
├── assets/                # Static assets
│   ├── fonts/            # Custom fonts (Montserrat, PlayfairDisplay, Roboto, SFProDisplay, WayCome, Cachet)
│   ├── images/           # App images and logos
│   └── videos/           # Video assets
└── src/
    ├── screens/          # All app screens
    ├── components/       # Reusable components
    ├── contexts/         # React contexts (Auth, SignUp, MapTransition)
    ├── config/           # Configuration files (colors, fonts, i18n, theme)
    ├── ui/              # UI component library
    ├── store/           # Redux store configuration
    ├── hooks/           # Custom React hooks
    ├── utils/           # Utility functions
    └── validation/      # Validation schemas
```

## Technology Stack

### Core Technologies
- **React Native**: 0.79.5
- **Expo**: 53.0.20
- **TypeScript**: 5.8.3
- **React**: 19.0.0

### Navigation & State Management
- **React Navigation**: v7 with native stack navigation
- **Redux Toolkit**: 2.8.2 with Redux Persist
- **React Redux**: 9.1.2

### UI & Styling
- **NativeWind**: 4.1.23 (TailwindCSS for React Native)
- **Moti**: 0.30.0 (animations)
- **React Native Reanimated**: 3.17.4
- **React Native Vector Icons**: 10.2.0
- **Expo Linear Gradient**: 14.1.5

### Key Features & Libraries
- **Maps**: Expo Maps 0.11.0, React Native Maps 1.20.1
- **Camera & Media**: Expo Camera, Image Picker, AV, Document Picker
- **Location**: Expo Location 18.1.1
- **Forms & Validation**: Yup 1.6.1
- **Storage**: Async Storage 2.1.2

## App Architecture

### Authentication System
- **AuthContext**: Manages authentication state
- **SignUpContext**: Handles user registration flow
- Multi-step onboarding process with different user types (customer/transporter)

### Navigation Structure
- Stack-based navigation with screen-specific animations
- Route determination based on authentication status and user type
- Separate flows for customers and transporters

### Services Offered
1. **Express Delivery**: Fast parcel delivery
2. **Standard Delivery**: Regular parcel delivery
3. **Moving Services**: Hourly truck rental with/without labor
4. **Storage Services**: Smart storage solution with temporary storage

### User Types
- **Customers**: Can book delivery and transport services
- **Transporters**: Independent drivers who accept and fulfill orders

### Key Screens
- **Onboarding**: Welcome and feature introduction
- **Authentication**: Login/signup flows
- **Home Screens**: Different interfaces for customers vs transporters
- **Service Flows**: Express, Standard, Moving, Storage booking flows
- **Profile Management**: Settings, payment methods, order history
- **Map Integration**: Real-time tracking and location services
- **My Orders**: Order management screen with tabs for active/completed/cancelled orders
- **Track Package**: Real-time package tracking with search functionality and detailed order timeline

### Key Components

#### ProfessionalSidebar (`src/components/ProfessionalSidebar.tsx`)
- Clean, professional navigation drawer without gradients
- 7 menu items: Home, My Orders, Track Package, Profile, Addresses, Help & Support, Settings
- **Real-time badge count** showing active orders from backend
- Real-time user data from MongoDB with proper error handling
- iPhone safe area support for notch/Dynamic Island
- Smooth spring animations with scale effects
- Responsive design optimized for small phones

#### PhoneNumberInput (`src/components/PhoneNumberInput.tsx`)
- Custom phone input with country code picker
- Modal with 70% height for country selection
- 19 countries with flags and dial codes
- Search functionality for countries
- Validation and error display

#### NotificationModal (`src/components/NotificationModal.tsx`)
- Full-screen notification center with tabs (All/Unread)
- Detailed notification view with actions
- Support for order, delivery, promotion, and system notifications
- Animated transitions and gradients

#### MyOrdersScreen (`src/screens/MyOrdersScreen.tsx`)
- Professional order management interface
- Three tabs: Active, Completed, Cancelled
- **Real backend integration** with MongoDB data
- Order cards with status badges and pricing
- Pull-to-refresh functionality
- Enhanced empty states with user guidance
- Comprehensive error handling (auth, network, server errors)
- Matches backend Order schema with full data structure

#### TrackPackageScreen (`src/screens/TrackPackageScreen.tsx`)
- **Real-time order tracking** with backend integration
- Search by Order ID or Order Number
- Complete order timeline with status history
- Driver information with contact capability
- Package details and route visualization
- Automatic refresh and pull-to-refresh
- Security: Users can only track their own orders

### UI Components
Custom component library in `src/ui/`:
- Button, Text, Input, SearchInput
- Card, Icon components
- Consistent design system with theme configuration

### Styling System
- Global CSS with TailwindCSS utility classes
- Custom color scheme and typography
- Responsive design principles
- Animation support with Moti and Reanimated

## Development Notes
- Uses Expo development workflow
- TypeScript for type safety
- Redux for global state management with persistence
- Modular architecture with clear separation of concerns
- Comprehensive form validation with Yup schemas

## Backend Integration Plan

### Current Status
The frontend currently uses **MOCK DATA** for all authentication and API calls. A comprehensive Express.js backend implementation is planned to replace all mock functionality with real database operations.

### Planned Backend Architecture
- **Express.js**: Latest version with ESM modules
- **MongoDB**: With Mongoose ODM for data modeling
- **Redis**: For session management and caching
- **Socket.io**: Real-time communication with Redis adapter
- **Firebase Admin SDK**: For Google authentication integration
- **JWT Authentication**: Token-based auth system
- **Modern Stack**: Node.js v22 LTS, TypeScript, latest 2025 compatible versions

### Integration Points
1. **Authentication System**: Replace AuthContext mock calls with real API endpoints
2. **User Management**: Real user registration, login, and profile management
3. **Real-time Features**: WebSocket integration for order tracking and notifications
4. **Database Operations**: Replace AsyncStorage-only data with persistent MongoDB storage
5. **API Architecture**: RESTful API with proper validation, error handling, and security

### Implementation Plan
Detailed implementation roadmap available in `/BACKEND_PLAN.md` with:
- Complete project structure and setup instructions
- Database schemas and API endpoints
- Real-time WebSocket configuration
- Frontend integration specifications
- Testing and deployment guidelines

### Migration Strategy
1. **Phase 1**: Set up backend infrastructure and authentication APIs
2. **Phase 2**: Replace mock authentication in frontend with real API calls
3. **Phase 3**: Implement real-time features and order management
4. **Phase 4**: Add Google authentication and advanced features

## Pending Issues (2025-01-12)

### Google OAuth Sign-In Not Working
**Problem**: The "Continue with Google" button is implemented but the OAuth flow is not opening the sign-in screen in Expo Go.

**Current Implementation Status**:
- ✅ Backend Google auth routes created (`/api/v1/auth/google`)
- ✅ Firebase Admin SDK configured in backend
- ✅ User model updated with OAuth fields (googleId, firebaseUid, authProvider)
- ✅ Frontend packages installed (expo-auth-session, expo-crypto, expo-web-browser)
- ✅ Google Sign-In button added to AuthSelectionScreen
- ❌ OAuth flow not triggering properly

**What Was Tried**:
1. Used Expo's test client ID: `603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com`
2. Added iosClientId and androidClientId properties
3. Configured environment variables with Firebase Web Client ID

**Next Steps to Fix**:
1. Check if `promptAsync()` is being called correctly
2. Verify WebBrowser.maybeCompleteAuthSession() is at the top level
3. Test with different OAuth configurations
4. Consider using @react-native-google-signin/google-signin package instead
5. Ensure proper redirect URIs are configured

**Files Involved**:
- `/src/AuthSelectionScreen.tsx` - Google Sign-In button implementation
- `/src/services/googleAuth.ts` - Google auth service
- `/src/config/googleAuth.ts` - OAuth client configuration
- `/backend/src/controllers/googleAuthController.js` - Backend handler
- `/backend/src/routes/googleAuth.js` - API routes

**Environment Variables Set**:
- Backend: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com`
- Frontend: Same client ID in `.env`

## Change Log
- Initial project setup and documentation created
- **Authentication Flow Changes**:
  - Removed "Get Started" button from AuthSelectionScreen
  - Added "Continue with Google" button under login in AuthSelectionScreen
  - Removed social media buttons (Facebook, Apple) from LoginModal
  - Streamlined LoginModal to only show email input
  - Removed OTP verification step from signup flow
  - Modified IdentityScreen to skip directly to AddressLocaleScreen after form completion
  - Updated step indicators from "Step 2 of 7" to "Step 2 of 6" in signup flow
  - Added all signup screen components to Stack.Navigator in App.tsx
  - Added "Sign Up" button to LoginModal to navigate to signup flow
  - Minimized LoginModal height from 80% to 60% of screen height and reduced spacing for more compact design
- **Backend Implementation** (Completed):
  - Created comprehensive BACKEND_PLAN.md with full implementation roadmap
  - Implemented complete Express.js backend with MongoDB, Redis, Socket.io
  - Deployed Docker containerization with multi-service setup
  - Created production-ready API endpoints for authentication, users, orders
  - Added file upload handling, real-time WebSocket features
  - Implemented JWT authentication with refresh tokens and Redis storage
- **Frontend Integration** (Completed):
  - **Phase 5A**: Authentication Integration - Real login/logout with backend APIs
  - **Phase 5B**: SignUp Flow Integration - Complete registration with backend
  - **Phase 5C**: Profile Management Integration - Real user profiles, statistics, image upload
- **UI Components Updates** (2024-12-11):
  - **Email Validation Fix**: Fixed `/auth/check-email` endpoint missing from backend causing false positive validation
  - **MongoDB Index Fix**: Removed problematic `firebaseUid` unique index preventing user registration
  - **PhoneNumberInput Component**: Created professional phone input with country code picker modal (70% height)
  - **ProfessionalSidebar Component**: 
    - Replaced gradient sidebar with clean professional design
    - Removed Services, Notifications, and Payment Methods menu items
    - Fixed iPhone responsiveness with safe area insets
    - Enhanced animations with spring physics and scale effects
    - Fixed auto-closing issue when fetching user data from MongoDB
    - Optimized for small phones with reduced padding
  - **API Service Updates**: Fixed getCurrentUser to properly extract user from nested backend response
  - **Real Data Integration**: Connected My Orders screen to backend MongoDB with proper error handling and user feedback
- **Latest Updates** (2025-01-11):
  - **Addresses Management System**: Complete CRUD functionality with backend integration
    - Created AddAddressScreen with full-screen navigation instead of modal
    - Integrated Google Maps Places API for address autocomplete (worldwide support)
    - Fixed UI responsiveness issues with address type selection
    - Converted address type buttons to professional dropdown menu
    - Added proper keyboard avoidance and error handling
  - **LoginModal Enhancements**:
    - Added password input field with show/hide toggle
    - Increased modal height to 75% for better keyboard accommodation
    - Enhanced KeyboardAvoidingView with aggressive positioning for iOS
    - Added comprehensive error handling with user-friendly messages
    - Fixed API response structure handling for login endpoint
    - Integrated real backend authentication with proper token management
  - **Loading Screen Redesign**:
    - Custom logo progress bar animation (grey to color fill from left to right)
    - Simplified design with only logo animation, removed all text and percentages
    - Clean white background with professional appearance
    - 3-second smooth color-fill animation using React Native Reanimated
  - **Backend Fixes**:
    - Fixed login API response structure to match frontend expectations
    - Enhanced error logging and debugging for authentication issues
    - Improved API service compatibility with both old and new response formats