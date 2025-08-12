# iBox Backend API Server

<div align="center">
  <h3>🚚 Modern Transportation & Delivery API</h3>
  <p>Express.js backend with MongoDB, Redis, and comprehensive Docker setup</p>
  
  ![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
  ![Express](https://img.shields.io/badge/Express-4.21+-blue)
  ![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
  ![Redis](https://img.shields.io/badge/Redis-7.2-red)
  ![Docker](https://img.shields.io/badge/Docker-Ready-blue)
</div>

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🐳 Docker Setup (Recommended)](#-docker-setup-recommended)
- [💻 Manual Setup](#-manual-setup)
- [📡 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [📱 Frontend Integration](#-frontend-integration)
- [🔧 Development](#-development)
- [🚀 Production](#-production)
- [❓ Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and navigate
cd backend

# One-command setup (installs everything)
./docker-setup.sh

# Your API is now running at http://localhost:5000
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URLs

# Start development server
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Express API   │    │    MongoDB      │
│    Frontend     │◄──►│     Server      │◄──►│    Database     │
│  (Port 19006)   │    │  (Port 5000)    │    │  (Port 27017)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │      Redis      │
                       │   Cache/Session │
                       │   (Port 6379)   │
                       └─────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 22 LTS with ESM modules
- **Framework**: Express.js 4.21+ with comprehensive middleware
- **Database**: MongoDB 7.0 with Mongoose ODM
- **Cache**: Redis 7.2 for sessions and caching
- **Authentication**: JWT tokens with refresh token rotation
- **Validation**: express-validator with custom rules
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Containerization**: Docker with multi-stage builds

## 🐳 Docker Setup (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Automated Setup

```bash
# Make scripts executable (if needed)
chmod +x docker-setup.sh docker-scripts.sh

# Run automated setup
./docker-setup.sh
```

This will:
- ✅ Check system requirements
- ✅ Pull all Docker images
- ✅ Create necessary directories
- ✅ Setup environment configuration
- ✅ Start all services with health checks
- ✅ Initialize database with sample data
- ✅ Verify API endpoints

### Manual Docker Commands

```bash
# Start all services
./docker-scripts.sh dev start

# Stop all services
./docker-scripts.sh dev stop

# View logs
./docker-scripts.sh dev logs

# View specific service logs
./docker-scripts.sh dev logs app
./docker-scripts.sh dev logs mongodb

# Check service status
./docker-scripts.sh status

# Open shell in API container
./docker-scripts.sh dev shell app

# Database operations
./docker-scripts.sh db backup
./docker-scripts.sh db seed
./docker-scripts.sh db restore backup_file.gz
```

### Services Overview

| Service | Port | Description | Admin UI |
|---------|------|-------------|----------|
| **API Server** | 5000 | Main backend application | - |
| **MongoDB** | 27017 | Database server | http://localhost:8081 |
| **Redis** | 6379 | Cache & sessions | http://localhost:8082 |
| **Mailhog** | 1025/8025 | Email testing | http://localhost:8025 |

**Admin Credentials**: `admin` / `admin` for all admin interfaces

## 💻 Manual Setup

### Prerequisites
- Node.js 22+ LTS
- MongoDB 5.0+
- Redis 6.0+

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ibox_dev
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

3. **Start External Services**
   ```bash
   # Start MongoDB (macOS with Homebrew)
   brew services start mongodb-community
   
   # Start Redis
   redis-server
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Available Scripts

```json
{
  "dev": "nodemon src/app.js",
  "start": "node src/app.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "lint": "eslint src/",
  "format": "prettier --write src/"
}
```

## 📡 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api/v1`
- **Docker**: `http://localhost:5000/api/v1`

### Health Check
```bash
GET /health
```

### Authentication Endpoints

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890", 
  "password": "Password123",
  "userType": "customer"
}
```

#### Login User
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get User Profile
```bash
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## 🧪 Testing

### Test Sample Data
The Docker setup includes pre-loaded test users:

```javascript
// Customer Account
{
  email: "customer@example.com",
  password: "Password123",
  userType: "customer"
}

// Transporter Account  
{
  email: "transporter@example.com",
  password: "Password123", 
  userType: "transporter"
}
```

### API Testing Examples

```bash
# Health Check
curl http://localhost:5000/health

# Register New User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User", 
    "email": "test@example.com",
    "phone": "+1555123456",
    "password": "Password123",
    "userType": "customer"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'

# Get Profile (replace {token} with actual access token)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer {access_token}"
```

### Using Postman/Insomnia
1. Import the API endpoints
2. Set base URL to `http://localhost:5000/api/v1`
3. For protected routes, add `Authorization: Bearer {token}` header
4. Use the test accounts for immediate testing

## 📱 Frontend Integration

### ⚠️ Current Status: NOT YET CONNECTED

The backend API is **fully functional and ready**, but the React Native frontend is **still using mock data**. Here's the integration status:

#### ✅ Backend Ready
- Complete authentication system
- All API endpoints functional
- Database with sample data
- Docker environment running

#### ❌ Frontend Not Connected  
- React Native app still uses `mockData.js`
- AuthContext not updated to use real API
- Network requests not configured
- API integration pending

### Frontend Integration Steps (TODO)

To connect the frontend to this backend:

1. **Update React Native AuthContext**
   ```javascript
   // Replace in Ibox/src/context/AuthContext.js
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:5000/api/v1'  // or your local IP
     : 'https://your-production-api.com/api/v1';

   const login = async (userData, userType) => {
     const response = await fetch(`${API_BASE_URL}/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         email: userData.email,
         password: userData.password,
       }),
     });
     const data = await response.json();
     // Handle response and update auth state
   };
   ```

2. **Replace Mock Data**
   ```bash
   # In the frontend project
   rm src/data/mockData.js
   # Update all components to use real API calls
   ```

3. **Configure Network Settings**
   ```javascript
   // For React Native development, use your local IP instead of localhost
   const API_BASE_URL = 'http://192.168.1.100:5000/api/v1';
   ```

4. **Add Error Handling**
   ```javascript
   // Implement proper error handling for network requests
   // Handle token refresh logic
   // Add loading states
   ```

### Network Configuration for React Native

React Native cannot access `localhost` directly. Use one of these:

```javascript
// Option 1: Use your local IP (find with `ipconfig` or `ifconfig`)
const API_BASE_URL = 'http://192.168.1.100:5000/api/v1';

// Option 2: Use Docker bridge (if frontend is also containerized)  
const API_BASE_URL = 'http://host.docker.internal:5000/api/v1';

// Option 3: For Android emulator specifically
const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';
```

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── app.js              # Main Express app
│   ├── config/             # Database & Redis config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── services/           # Business logic
├── docker/                 # Docker configurations
├── logs/                   # Application logs
└── uploads/               # File uploads
```

### Development Workflow

1. **Start Development Environment**
   ```bash
   ./docker-setup.sh  # One-time setup
   ./docker-scripts.sh dev start
   ```

2. **Make Changes**
   - Edit files in `src/` directory
   - Changes are automatically reloaded (nodemon)

3. **View Logs**
   ```bash
   ./docker-scripts.sh dev logs app
   ```

4. **Database Management**
   ```bash
   # Access MongoDB admin UI
   open http://localhost:8081
   
   # Backup database
   ./docker-scripts.sh db backup
   
   # Seed fresh data
   ./docker-scripts.sh db seed
   ```

5. **Test API Changes**
   ```bash
   curl http://localhost:5000/health
   ```

### Adding New Endpoints

1. Create route handler in `src/controllers/`
2. Add validation rules in `src/middleware/validation.js`
3. Define routes in `src/routes/`
4. Import routes in `src/app.js`
5. Test with curl or Postman

## 🚀 Production

### Production Docker Setup
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Monitor production services
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@mongo-host:27017/ibox_production
REDIS_URL=redis://password@redis-host:6379
JWT_SECRET=super-secure-random-string-64-chars-minimum
FRONTEND_URL=https://your-app.com
```

### Production Features
- SSL/HTTPS termination with Nginx
- Container health monitoring
- Automatic restarts with Watchtower
- Resource limits and logging
- Database backups and monitoring

## ❓ Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Kill process using port
kill -9 $(lsof -t -i:5000)
```

#### Docker Issues
```bash
# Reset Docker environment
./docker-scripts.sh cleanup

# Start fresh
./docker-setup.sh
```

#### Database Connection Issues
```bash
# Check MongoDB status
./docker-scripts.sh dev logs mongodb

# Reset database
docker-compose down -v
docker-compose up -d
```

#### API Not Responding
```bash
# Check API logs
./docker-scripts.sh dev logs app

# Verify health endpoint
curl http://localhost:5000/health

# Check all services status
./docker-scripts.sh status
```

### Getting Help

1. **Check logs**: `./docker-scripts.sh dev logs`
2. **Verify health**: `./docker-scripts.sh status` 
3. **Reset environment**: `./docker-scripts.sh cleanup && ./docker-setup.sh`
4. **Check documentation**: See `CLAUDE.md` for detailed technical info

### Development Tips

- Use MongoDB Express (http://localhost:8081) to inspect database
- Use Redis Commander (http://localhost:8082) to check cache/sessions  
- Use Mailhog (http://localhost:8025) to test emails
- API docs available at http://localhost:5000/api/docs (development only)
- Sample data is automatically loaded on first run

---

<div align="center">
  <h3>🚀 Your iBox backend is ready for development!</h3>
  <p>Start with <code>./docker-setup.sh</code> and begin building amazing transportation solutions.</p>
</div>