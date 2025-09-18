# iBox Services API Documentation

## Overview

The iBox Services API provides a comprehensive backend system for service discovery, pricing calculation, and booking. It supports multiple service categories including delivery, moving, storage, and specialized services.

## Base URL
```
http://localhost:5000/api/v1/services
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Service Categories

The system supports the following service categories:
- **delivery**: Standard and express delivery services
- **moving**: Residential and commercial moving services  
- **storage**: Temporary and long-term storage solutions
- **logistics**: Complex logistics and supply chain services
- **express**: Same-day and urgent delivery services
- **specialized**: Premium and white-glove services

## API Endpoints

### 1. Get All Services
**GET** `/services`

Retrieve all available services with filtering and pagination.

**Query Parameters:**
- `category` (optional): Filter by service category
- `serviceType` (optional): Filter by service type
- `search` (optional): Text search in service names and descriptions
- `lat`, `lng` (optional): Location coordinates for area-based filtering
- `radius` (optional): Search radius in meters (default: 50000)
- `minRating` (optional): Minimum average rating filter
- `maxPrice` (optional): Maximum base price filter
- `sortBy` (optional): Sort order (popularity, rating, price_low, price_high, newest, name)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)

**Example Request:**
```bash
GET /services?category=delivery&lat=40.7128&lng=-74.0060&sortBy=popularity&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "message": "Services retrieved successfully",
  "data": {
    "services": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Express Delivery",
        "slug": "express-delivery",
        "shortDescription": "Same-day delivery for urgent packages",
        "category": "express",
        "serviceType": "express",
        "icon": "zap",
        "color": {
          "primary": "#FF6B35",
          "gradient": ["#FF6B35", "#FF8A65", "#FFAB91"]
        },
        "pricing": {
          "baseFee": 15.00,
          "currency": "USD"
        },
        "metrics": {
          "averageRating": 4.7,
          "totalOrders": 1250,
          "popularityScore": 95
        },
        "priceRange": "From $15.00",
        "isAvailable": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### 2. Search Services
**GET** `/services/search`

Search services by text query with optional filters.

**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `category` (optional): Filter by category
- `serviceType` (optional): Filter by service type
- `lat`, `lng` (optional): Location coordinates
- `limit` (optional): Maximum results (default: 20, max: 50)

**Example Request:**
```bash
GET /services/search?q=express&category=delivery&limit=5
```

### 3. Get Service Categories
**GET** `/services/categories`

Retrieve all service categories with counts and top services.

**Example Response:**
```json
{
  "success": true,
  "message": "Service categories retrieved successfully",
  "data": {
    "categories": [
      {
        "category": "delivery",
        "count": 8,
        "services": [
          {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
            "name": "Express Delivery",
            "slug": "express-delivery",
            "icon": "zap",
            "shortDescription": "Same-day delivery for urgent packages",
            "color": { "primary": "#FF6B35" },
            "popularityScore": 95
          }
        ]
      }
    ]
  }
}
```

### 4. Get Popular Services
**GET** `/services/popular`

Retrieve the most popular services.

**Query Parameters:**
- `limit` (optional): Number of services (default: 10, max: 50)
- `category` (optional): Filter by category

### 5. Get Service Details
**GET** `/services/:serviceId`

Get detailed information about a specific service.

**Path Parameters:**
- `serviceId`: Service ID or slug

**Query Parameters:**
- `lat`, `lng` (optional): Check availability in specific location

**Example Response:**
```json
{
  "success": true,
  "message": "Service details retrieved successfully",
  "data": {
    "service": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Express Delivery",
      "description": "Fast and reliable same-day delivery service...",
      "category": "express",
      "serviceType": "express",
      "pricing": {
        "model": "distance_based",
        "baseFee": 15.00,
        "distanceRates": [
          {
            "minDistance": 0,
            "maxDistance": 5,
            "flatRate": 15.00
          }
        ],
        "surcharges": [
          {
            "type": "peak_hours",
            "name": "Peak Hours Surcharge",
            "percentage": 25
          }
        ]
      },
      "specifications": {
        "maxWeight": 25,
        "maxDistance": 50,
        "estimatedDuration": {
          "min": 30,
          "max": 180,
          "unit": "minutes"
        }
      },
      "features": [
        {
          "name": "Real-time tracking",
          "description": "Track your package in real-time",
          "icon": "map-pin",
          "isHighlight": true
        }
      ],
      "isAvailableInArea": true,
      "currentAvailability": true
    },
    "relatedServices": []
  }
}
```

### 6. Check Service Availability
**GET** `/services/:serviceId/availability`

Check if a service is available at a specific location and time.

**Path Parameters:**
- `serviceId`: Service ID or slug

**Query Parameters:**
- `lat`, `lng` (optional): Location coordinates
- `date` (optional): Check availability for specific date (ISO 8601 format)

**Example Response:**
```json
{
  "success": true,
  "message": "Service availability retrieved successfully",
  "data": {
    "serviceId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "serviceName": "Express Delivery",
    "isAvailable": true,
    "details": {
      "isActive": true,
      "isAvailableInArea": true,
      "isCurrentlyOpen": true,
      "isBlackedOut": false,
      "operatingHours": {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "20:00",
        "isAvailable": true
      }
    }
  }
}
```

### 7. Calculate Service Pricing
**POST** `/services/:serviceId/pricing` 🔒

Calculate pricing for a specific service based on order details.

**Authentication Required:** Yes

**Path Parameters:**
- `serviceId`: Service ID

**Request Body:**
```json
{
  "pickupLocation": {
    "address": "123 Main St, New York, NY",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "dropoffLocation": {
    "address": "456 Broadway, New York, NY",
    "coordinates": {
      "lat": 40.7589,
      "lng": -73.9851
    }
  },
  "packageDetails": {
    "description": "Important documents",
    "weight": 2.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 5
    },
    "fragile": false,
    "perishable": false
  },
  "scheduledTime": "2024-01-15T14:30:00Z",
  "additionalServices": [
    {
      "type": "fragile_handling"
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Pricing calculated successfully",
  "data": {
    "pricing": {
      "basePrice": 15.00,
      "additionalServices": [
        {
          "type": "fragile_handling",
          "name": "Fragile Item Handling",
          "cost": 8.00
        }
      ],
      "additionalCosts": 8.00,
      "subtotal": 23.00,
      "taxAmount": 1.84,
      "totalAmount": 24.84,
      "currency": "USD"
    },
    "serviceDetails": {
      "name": "Express Delivery",
      "serviceType": "express",
      "estimatedDistance": 5420,
      "estimatedDuration": 45,
      "estimatedDeliveryTime": "2024-01-15T15:15:00Z"
    },
    "breakdown": {
      "baseFee": 15.00,
      "distanceFee": 0.00,
      "surcharges": [],
      "discounts": []
    }
  }
}
```

### 8. Book Service
**POST** `/services/:serviceId/book` 🔒

Book a service and create an order.

**Authentication Required:** Yes (Customer only)

**Path Parameters:**
- `serviceId`: Service ID

**Request Body:**
```json
{
  "pickupLocation": {
    "address": "123 Main St, New York, NY",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "contactPerson": "John Doe",
    "contactPhone": "+1234567890",
    "notes": "Ring doorbell twice"
  },
  "dropoffLocation": {
    "address": "456 Broadway, New York, NY",
    "coordinates": {
      "lat": 40.7589,
      "lng": -73.9851
    },
    "contactPerson": "Jane Smith",
    "contactPhone": "+1987654321"
  },
  "packageDetails": {
    "description": "Important documents",
    "weight": 2.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 5
    },
    "fragile": false,
    "requiresSignature": true
  },
  "scheduledPickupTime": "2024-01-15T14:30:00Z",
  "priority": "normal",
  "paymentMethod": "card",
  "specialInstructions": "Handle with care",
  "additionalServices": [
    {
      "type": "fragile_handling"
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Service booked successfully",
  "data": {
    "order": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "orderNumber": "IB-ABC123-DEF456",
      "customer": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "serviceType": "express",
      "status": "pending",
      "pricing": {
        "totalAmount": 24.84,
        "currency": "USD"
      },
      "createdAt": "2024-01-15T12:00:00Z"
    },
    "service": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Express Delivery",
      "category": "express",
      "serviceType": "express"
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication token required
- `VALIDATION_ERROR`: Request validation failed
- `SERVICE_NOT_FOUND`: Service does not exist
- `SERVICE_UNAVAILABLE`: Service is not active or available
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `BOOKING_RATE_LIMIT`: Too many booking attempts
- `SEARCH_RATE_LIMIT`: Too many search requests
- `DISTANCE_LIMIT_EXCEEDED`: Distance exceeds service limits
- `WEIGHT_LIMIT_EXCEEDED`: Package weight exceeds limits
- `SERVICE_AREA_UNAVAILABLE`: Service not available in location

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes
- **Search endpoints**: 30 requests per minute
- **Pricing calculations**: 20 requests per minute per user
- **Service bookings**: 10 bookings per 5 minutes (global), 5 per 5 minutes per user

## Sample Service Types

### Express Delivery
- **Category**: express
- **Base Fee**: $15.00
- **Max Weight**: 25kg
- **Max Distance**: 50km
- **Duration**: 30-180 minutes

### Standard Delivery  
- **Category**: delivery
- **Base Fee**: $8.00
- **Max Weight**: 50kg
- **Max Distance**: 100km
- **Duration**: 12-48 hours

### Moving Service
- **Category**: moving
- **Base Fee**: $120.00
- **Max Weight**: 5000kg
- **Max Distance**: 200km
- **Duration**: 2-12 hours

### Storage Service
- **Category**: storage
- **Base Fee**: $50.00/month
- **Max Weight**: 2000kg
- **Climate controlled**: Yes
- **24/7 Access**: Yes

### White Glove Service
- **Category**: specialized
- **Base Fee**: $200.00
- **Max Weight**: 200kg
- **Max Distance**: 100km
- **Includes**: Assembly, unpacking, debris removal

## Integration Examples

### Frontend Integration (React/React Native)

```javascript
// Get services
const getServices = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/services?${params}`);
  return response.json();
};

// Calculate pricing
const calculatePricing = async (serviceId, orderDetails) => {
  const response = await fetch(`/api/v1/services/${serviceId}/pricing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderDetails)
  });
  return response.json();
};

// Book service
const bookService = async (serviceId, bookingDetails) => {
  const response = await fetch(`/api/v1/services/${serviceId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingDetails)
  });
  return response.json();
};
```

### Mobile App Flow

1. **Service Discovery**: Use `/services` with location filters
2. **Service Selection**: Get details with `/services/:id`
3. **Pricing**: Calculate cost with `/services/:id/pricing`
4. **Booking**: Create order with `/services/:id/book`
5. **Tracking**: Use order endpoints for status updates

## Testing

Use the provided seeder script to populate test data:

```bash
cd backend
node scripts/seedServices.js
```

This creates 6 sample services across different categories with realistic pricing and availability data.

## Next Steps

The services API is now ready for frontend integration. Key features implemented:

✅ **Service Discovery**: Location-based filtering and search  
✅ **Dynamic Pricing**: Complex pricing models with surcharges/discounts  
✅ **Service Booking**: Complete order creation workflow  
✅ **Availability Checking**: Time and location-based availability  
✅ **Rate Limiting**: Protection against abuse  
✅ **Comprehensive Validation**: Input sanitization and validation  
✅ **Sample Data**: Ready-to-use test services  

The system is designed to scale and can easily accommodate new service types, pricing models, and business requirements.
