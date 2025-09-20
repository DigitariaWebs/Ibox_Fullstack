import { ApiResponse, LoginCredentials, LoginResponse, VerificationStats, VerificationDetails, Driver } from './types.js';

export class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://127.0.0.1:5000/api/v1') {
    this.baseUrl = baseUrl;
    this.authToken = localStorage.getItem('adminToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.authToken = response.data.tokens.accessToken;
      localStorage.setItem('adminToken', this.authToken);
    }

    return response as LoginResponse;
  }

  async logout(): Promise<void> {
    this.authToken = null;
    localStorage.removeItem('adminToken');
  }

  async getVerificationStats(): Promise<ApiResponse<VerificationStats>> {
    return this.makeRequest<VerificationStats>('/admin/verifications/stats');
  }

  async getVerifications(): Promise<ApiResponse<{ drivers: Driver[] }>> {
    return this.makeRequest<{ drivers: Driver[] }>('/admin/verifications');
  }

  async getVerificationDetails(driverId: string): Promise<ApiResponse<VerificationDetails>> {
    return this.makeRequest<VerificationDetails>(`/admin/verifications/${driverId}`);
  }

  async approveVerification(driverId: string, notes?: string): Promise<ApiResponse> {
    return this.makeRequest(`/admin/verifications/${driverId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectVerification(driverId: string, reason: string, notes?: string): Promise<ApiResponse> {
    return this.makeRequest(`/admin/verifications/${driverId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async approveStep(driverId: string, step: string): Promise<ApiResponse> {
    return this.makeRequest(`/admin/verifications/${driverId}/approve-step`, {
      method: 'POST',
      body: JSON.stringify({ step }),
    });
  }

  async rejectStep(driverId: string, step: string, reason: string): Promise<ApiResponse> {
    return this.makeRequest(`/admin/verifications/${driverId}/reject-step`, {
      method: 'POST',
      body: JSON.stringify({ step, reason }),
    });
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}
