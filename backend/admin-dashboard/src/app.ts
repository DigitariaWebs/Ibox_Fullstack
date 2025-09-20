import { ApiService } from './api.js';
import { NotificationManager } from './notifications.js';
import { ModalManager } from './modal.js';
import { Utils } from './utils.js';
import { 
  Driver, 
  VerificationStats, 
  LoginCredentials,
  LoadingState
} from './types.js';

export class AdminDashboard {
  private api: ApiService;
  private notifications: NotificationManager;
  private modal: ModalManager;
  
  private loadingState: LoadingState = { isLoading: false };
  private drivers: Driver[] = [];
  private stats: VerificationStats | null = null;

  constructor() {
    this.api = new ApiService();
    this.notifications = new NotificationManager();
    this.modal = new ModalManager();
    
    // Connect API service to modal manager
    this.modal.setApiService(this.api);
    
    // Make instances available globally for modal callbacks
    (window as any).adminDashboard = this;
    (window as any).notificationManager = this.notifications;
    
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.setupEventListeners();
      
      if (this.api.isAuthenticated()) {
        await this.loadDashboard();
      } else {
        this.showLoginForm();
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.notifications.error('Failed to initialize dashboard');
    }
  }

  private setupEventListeners(): void {
    // Login form
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.refreshData.bind(this));
    }

    // Search input
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(this.handleSearch.bind(this), 300));
    }

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = (e.target as HTMLElement).getAttribute('data-filter');
        this.handleFilter(filter || 'all');
      });
    });
  }

  private async handleLogin(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const credentials: LoginCredentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    if (!Utils.validateEmail(credentials.email)) {
      this.notifications.error('Please enter a valid email address');
      return;
    }

    this.setLoading(true, 'Signing in...');

    try {
      const response = await this.api.login(credentials);
      
      if (response.success) {
        this.notifications.success('Login successful!');
        await this.loadDashboard();
      } else {
        this.notifications.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.notifications.error('Login failed. Please check your credentials.');
    } finally {
      this.setLoading(false);
    }
  }

  private async handleLogout(): Promise<void> {
    try {
      await this.api.logout();
      this.drivers = [];
      this.stats = null;
      this.showLoginForm();
      this.notifications.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      this.notifications.error('Logout failed');
    }
  }

  private async loadDashboard(): Promise<void> {
    this.setLoading(true, 'Loading dashboard...');

    try {
      await Promise.all([
        this.loadStats(),
        this.loadDrivers()
      ]);
      
      this.showDashboard();
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.notifications.error('Failed to load dashboard data');
    } finally {
      this.setLoading(false);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const response = await this.api.getVerificationStats();
      if (response.success && response.data) {
        this.stats = response.data;
        this.updateStatsDisplay();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      throw error;
    }
  }

  private async loadDrivers(): Promise<void> {
    try {
      const response = await this.api.getVerifications();
      if (response.success && response.data) {
        this.drivers = response.data.drivers;
        this.updateDriversDisplay();
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
      throw error;
    }
  }

  private async refreshData(): Promise<void> {
    await this.loadDashboard();
    this.notifications.success('Data refreshed');
  }

  private updateStatsDisplay(): void {
    if (!this.stats) return;

    const elements = {
      total: document.getElementById('total-drivers'),
      pending: document.getElementById('pending-verifications'),
      approved: document.getElementById('approved-drivers'),
      rejected: document.getElementById('rejected-drivers'),
    };

    Object.entries(elements).forEach(([key, element]) => {
      if (element) {
        element.textContent = this.stats![key as keyof VerificationStats].toString();
      }
    });
  }


  private getDriverCardHTML(driver: Driver): string {
    const progress = Utils.calculateVerificationProgress(driver);
    const status = driver.transporterDetails?.verificationStatus || 'pending';
    const statusConfig = this.getStatusConfig(status);

    return `
      <div class="card hover:shadow-medium transition-shadow duration-200" data-driver-id="${driver._id}">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-lg font-semibold text-primary-600">
                  ${Utils.getInitials(driver.firstName, driver.lastName)}
                </span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">${driver.firstName} ${driver.lastName}</h3>
                <p class="text-sm text-gray-600">${driver.email}</p>
              </div>
            </div>
            <span class="badge ${statusConfig.className}">${statusConfig.badge}</span>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Verification Progress</span>
              <span class="text-sm text-gray-600">${progress.completed}/${progress.total} steps</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-primary-500 h-2 rounded-full transition-all duration-300" style="width: ${progress.percentage}%"></div>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>📱 ${driver.phone}</span>
            <span>📅 ${Utils.formatDate(driver.createdAt)}</span>
          </div>

          <div class="flex space-x-2">
            <button class="btn btn-sm btn-primary view-details-btn" data-driver-id="${driver._id}">
              View Details
            </button>
            ${status === 'pending' ? `
              <button class="btn btn-sm btn-success approve-driver-btn" data-driver-id="${driver._id}">
                Approve
              </button>
              <button class="btn btn-sm btn-danger reject-driver-btn" data-driver-id="${driver._id}">
                Reject
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private getEmptyStateHTML(): string {
    return `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🚚</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No drivers found</h3>
        <p class="text-gray-600">No driver verifications are currently pending.</p>
      </div>
    `;
  }

  private addDriverCardListeners(): void {
    // View details buttons
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    viewDetailsBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const driverId = (e.target as HTMLElement).getAttribute('data-driver-id');
        if (driverId) {
          await this.viewDriverDetails(driverId);
        }
      });
    });

    // Approve driver buttons
    const approveBtns = document.querySelectorAll('.approve-driver-btn');
    approveBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const driverId = (e.target as HTMLElement).getAttribute('data-driver-id');
        if (driverId) {
          await this.approveDriver(driverId);
        }
      });
    });

    // Reject driver buttons
    const rejectBtns = document.querySelectorAll('.reject-driver-btn');
    rejectBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const driverId = (e.target as HTMLElement).getAttribute('data-driver-id');
        if (driverId) {
          await this.rejectDriver(driverId);
        }
      });
    });
  }

  private async viewDriverDetails(driverId: string): Promise<void> {
    this.setLoading(true, 'Loading driver details...');

    try {
      const response = await this.api.getVerificationDetails(driverId);
      if (response.success && response.data) {
        this.modal.showDriverDetails(response.data);
      } else {
        this.notifications.error(response.message || 'Failed to load driver details');
      }
    } catch (error) {
      console.error('Failed to load driver details:', error);
      this.notifications.error('Failed to load driver details');
    } finally {
      this.setLoading(false);
    }
  }

  private async approveDriver(driverId: string): Promise<void> {
    this.modal.showConfirmation(
      'Approve Driver',
      'Are you sure you want to approve this driver? This action cannot be undone.',
      async () => {
        this.setLoading(true, 'Approving driver...');
        try {
          const response = await this.api.approveVerification(driverId, 'Approved by admin via dashboard');
          if (response.success) {
            this.notifications.success('Driver approved successfully!');
            await this.refreshData();
          } else {
            this.notifications.error(response.message || 'Failed to approve driver');
          }
        } catch (error) {
          console.error('Failed to approve driver:', error);
          this.notifications.error('Failed to approve driver');
        } finally {
          this.setLoading(false);
        }
      }
    );
  }

  private async rejectDriver(driverId: string): Promise<void> {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim().length < 10) {
      this.notifications.error('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    this.setLoading(true, 'Rejecting driver...');
    try {
      const response = await this.api.rejectVerification(driverId, reason.trim(), 'Rejected by admin via dashboard');
      if (response.success) {
        this.notifications.success('Driver rejected successfully!');
        await this.refreshData();
      } else {
        this.notifications.error(response.message || 'Failed to reject driver');
      }
    } catch (error) {
      console.error('Failed to reject driver:', error);
      this.notifications.error('Failed to reject driver');
    } finally {
      this.setLoading(false);
    }
  }

  private handleSearch(e: Event): void {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    const filteredDrivers = this.drivers.filter(driver => 
      driver.firstName.toLowerCase().includes(query) ||
      driver.lastName.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.phone.includes(query)
    );
    
    this.updateDriversDisplay(filteredDrivers);
  }

  private handleFilter(filter: string): void {
    let filteredDrivers = this.drivers;
    
    if (filter !== 'all') {
      filteredDrivers = this.drivers.filter(driver => 
        driver.transporterDetails?.verificationStatus === filter
      );
    }
    
    this.updateDriversDisplay(filteredDrivers);
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('bg-primary-500', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
      activeBtn.classList.add('bg-primary-500', 'text-white');
    }
  }

  private updateDriversDisplay(drivers: Driver[] = this.drivers): void {
    const container = document.getElementById('drivers-container');
    if (!container) return;

    if (drivers.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    container.innerHTML = drivers.map(driver => this.getDriverCardHTML(driver)).join('');
    this.addDriverCardListeners();
  }

  private getStatusConfig(status: string): { badge: string; className: string } {
    const configs: Record<string, { badge: string; className: string }> = {
      pending: { badge: 'Pending', className: 'badge-warning' },
      approved: { badge: 'Approved', className: 'badge-success' },
      rejected: { badge: 'Rejected', className: 'badge-danger' },
    };
    return configs[status] || { badge: 'Unknown', className: 'badge-warning' };
  }

  private setLoading(isLoading: boolean, message?: string): void {
    this.loadingState = { isLoading, message: message || '' };
    this.updateLoadingDisplay();
  }

  private updateLoadingDisplay(): void {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingOverlay) {
      loadingOverlay.classList.toggle('hidden', !this.loadingState.isLoading);
    }
    
    if (loadingMessage && this.loadingState.message) {
      loadingMessage.textContent = this.loadingState.message;
    }
  }

  private showLoginForm(): void {
    document.getElementById('login-section')?.classList.remove('hidden');
    document.getElementById('dashboard-section')?.classList.add('hidden');
  }

  private showDashboard(): void {
    document.getElementById('login-section')?.classList.add('hidden');
    document.getElementById('dashboard-section')?.classList.remove('hidden');
  }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});
