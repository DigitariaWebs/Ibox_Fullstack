import api from './api';

export interface ServiceLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PackageDetails {
  description: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  fragile?: boolean;
  value?: number;
}

export interface ServicePricingRequest {
  pickupLocation: ServiceLocation;
  dropoffLocation: ServiceLocation;
  packageDetails: PackageDetails;
  scheduledTime?: string;
  additionalServices?: string[];
  apartmentSize?: string;
  floorInfo?: {
    pickupFloor?: string;
    deliveryFloor?: string;
    hasElevatorPickup?: boolean;
    hasElevatorDelivery?: boolean;
    hasStairsPickup?: boolean;
    hasStairsDelivery?: boolean;
  };
}

export interface ServiceBookingRequest extends ServicePricingRequest {
  scheduledPickupTime?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  paymentMethod: string;
  specialInstructions?: string;
  estimatedDistance?: number;
  estimatedDuration?: number;
  pricingDetails: any;
}

export interface Service {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  serviceType: string;
  icon?: string;
  color?: {
    primary: string;
    secondary?: string;
    gradient?: string[];
  };
  pricing: {
    model: string;
    baseFee: number;
    perKmRate?: number;
    perMinuteRate?: number;
    currency: string;
  };
  status: string;
}

export interface PricingResponse {
  serviceId: string;
  serviceName: string;
  pricing: {
    baseFee: number;
    distanceFee: number;
    timeFee: number;
    surcharges: Array<{
      type: string;
      name: string;
      description?: string;
      amount: number;
    }>;
    discounts: Array<{
      type: string;
      name: string;
      description?: string;
      amount: number;
    }>;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };
}

export interface Order {
  _id: string;
  customer: string;
  serviceType: string;
  pickupLocation: ServiceLocation;
  dropoffLocation: ServiceLocation;
  packageDetails: PackageDetails;
  scheduledPickupTime?: string;
  priority: string;
  pricing: {
    totalAmount: number;
    currency: string;
  };
  status: 'pending' | 'confirmed' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

class ServicesService {
  /**
   * Get all available services with optional filtering
   */
  async getServices(params?: {
    category?: string;
    serviceType?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ services: Service[]; pagination: any }> {
    try {
      console.log('🔍 Fetching services from backend...', params);
      
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get(`/services?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        console.log('✅ Services loaded:', response.data.services.length, 'services');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch services');
      }
    } catch (error: any) {
      console.error('❌ Error fetching services:', error);
      throw new Error(error.message || 'Network error while fetching services');
    }
  }

  /**
   * Get service details by ID or slug
   */
  async getServiceDetails(serviceId: string): Promise<Service> {
    try {
      console.log('🔍 Fetching service details for:', serviceId);
      
      const response = await api.get(`/services/${serviceId}`);
      
      if (response.success && response.data?.service) {
        console.log('✅ Service details loaded:', response.data.service.name);
        return response.data.service;
      } else {
        throw new Error(response.message || 'Service not found');
      }
    } catch (error: any) {
      console.error('❌ Error fetching service details:', error);
      throw new Error(error.message || 'Network error while fetching service details');
    }
  }

  /**
   * Get service categories
   */
  async getServiceCategories(): Promise<string[]> {
    try {
      console.log('🔍 Fetching service categories...');
      
      const response = await api.get('/services/categories');
      
      if (response.success && response.data?.categories) {
        console.log('✅ Service categories loaded:', response.data.categories);
        return response.data.categories;
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }
    } catch (error: any) {
      console.error('❌ Error fetching service categories:', error);
      throw new Error(error.message || 'Network error while fetching categories');
    }
  }

  /**
   * Calculate pricing for a service
   */
  async calculatePricing(serviceId: string, request: ServicePricingRequest): Promise<PricingResponse> {
    try {
      console.log('💰 Calculating pricing for service:', serviceId, request);
      
      const response = await api.post(`/services/${serviceId}/pricing`, request);
      
      if (response.success && response.data) {
        console.log('✅ Pricing calculated:', response.data.pricing.totalAmount, response.data.pricing.currency);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to calculate pricing');
      }
    } catch (error: any) {
      console.error('❌ Error calculating pricing:', error);
      throw new Error(error.message || 'Network error while calculating pricing');
    }
  }

  /**
   * Book a service and create an order
   */
  async bookService(serviceId: string, request: ServiceBookingRequest): Promise<{ order: Order; service: Service }> {
    try {
      console.log('📦 Booking service:', serviceId, request);
      
      const response = await api.post(`/services/${serviceId}/book`, request);
      
      if (response.success && response.data) {
        console.log('✅ Service booked successfully. Order ID:', response.data.order._id);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to book service');
      }
    } catch (error: any) {
      console.error('❌ Error booking service:', error);
      throw new Error(error.message || 'Network error while booking service');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      console.log('❌ Cancelling order:', orderId, 'Reason:', reason);
      
      const response = await api.put(`/orders/${orderId}/cancel`, {
        reason: reason || 'Customer cancellation',
        cancelledBy: 'customer'
      });
      
      if (response.success && response.data?.order) {
        console.log('✅ Order cancelled successfully');
        return response.data.order;
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);
      throw new Error(error.message || 'Network error while cancelling order');
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<Order> {
    try {
      console.log('🔍 Fetching order status:', orderId);
      
      const response = await api.get(`/orders/${orderId}`);
      
      if (response.success && response.data?.order) {
        console.log('✅ Order status:', response.data.order.status);
        return response.data.order;
      } else {
        throw new Error(response.message || 'Order not found');
      }
    } catch (error: any) {
      console.error('❌ Error fetching order status:', error);
      throw new Error(error.message || 'Network error while fetching order status');
    }
  }

  /**
   * Map frontend service data to backend format
   */
  mapToServiceLocation(address: string, coordinates: { latitude: number; longitude: number }): ServiceLocation {
    return {
      address,
      coordinates: {
        lat: coordinates.latitude,
        lng: coordinates.longitude
      }
    };
  }

  /**
   * Map frontend package data to backend format
   */
  mapToPackageDetails(packageData: any): PackageDetails {
    console.log('🔍 mapToPackageDetails input:', packageData);
    
    // Ensure we always have a valid description
    let description = packageData.description || packageData.packageSize || 'Express delivery package';
    
    // If description is empty or too short, use fallback
    if (!description || description.trim().length < 5) {
      description = 'Express delivery package';
    }
    
    console.log('🔍 Final description:', description, 'length:', description.length);
    
    const result = {
      description: description.trim(),
      weight: packageData.weight,
      dimensions: packageData.dimensions ? {
        length: packageData.dimensions.length,
        width: packageData.dimensions.width,
        height: packageData.dimensions.height
      } : undefined,
      fragile: packageData.fragile || packageData.specialInstructions?.includes('fragile'),
      value: packageData.value
    };
    
    console.log('🔍 mapToPackageDetails output:', result);
    return result;
  }

  /**
   * Map urgency to priority
   */
  mapUrgencyToPriority(urgency: string): 'low' | 'normal' | 'high' | 'urgent' {
    switch (urgency) {
      case 'express_1h':
        return 'urgent';
      case 'express_2h':
        return 'high';
      case 'same_day':
        return 'normal';
      default:
        return 'normal';
    }
  }
}

export const servicesService = new ServicesService();
export default servicesService;
