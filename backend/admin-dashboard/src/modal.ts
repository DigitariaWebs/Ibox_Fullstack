import { ModalState } from './types.js';

// Extend Window interface for global objects
declare global {
  interface Window {
    notificationManager?: any;
    adminDashboard?: any;
  }
}

export class ModalManager {
  private overlay: HTMLElement | null = null;
  private currentModal: ModalState | null = null;
  private apiService: any = null;

  constructor() {
    this.createOverlay();
  }

  setApiService(apiService: any): void {
    this.apiService = apiService;
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'modal-overlay';
    this.overlay.className = 'modal-overlay hidden';
    document.body.appendChild(this.overlay);

    // Close modal when clicking overlay
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModal?.isOpen) {
        this.close();
      }
    });
  }

  showDriverDetails(driverData: any): void {
    this.currentModal = {
      isOpen: true,
      type: 'driver-details',
      data: driverData,
    };

    this.renderDriverDetailsModal(driverData);
    this.showOverlay();
  }

  showImageModal(imageSrc: string, title: string): void {
    this.currentModal = {
      isOpen: true,
      type: 'image-viewer',
      data: { imageSrc, title },
    };

    this.renderImageModal(imageSrc, title);
    this.showOverlay();
  }

  showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.currentModal = {
      isOpen: true,
      type: 'confirmation',
      data: { title, message, onConfirm, onCancel },
    };

    this.renderConfirmationModal(title, message, onConfirm, onCancel);
    this.showOverlay();
  }

  close(): void {
    if (this.currentModal?.isOpen) {
      this.currentModal.isOpen = false;
      this.hideOverlay();
      this.clearContent();
    }
  }

  private showOverlay(): void {
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      setTimeout(() => {
        this.overlay?.classList.add('animate-fade-in');
      }, 10);
    }
  }

  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.classList.remove('animate-fade-in');
      setTimeout(() => {
        this.overlay?.classList.add('hidden');
      }, 300);
    }
  }

  private clearContent(): void {
    if (this.overlay) {
      const content = this.overlay.querySelector('.modal-content');
      if (content) {
        content.innerHTML = '';
      }
    }
  }

  private renderDriverDetailsModal(driverData: any): void {
    if (!this.overlay) return;

    const content = this.createModalContent();
    content.innerHTML = this.getDriverDetailsHTML(driverData);
    this.overlay.appendChild(content);

    // Add event listeners for step actions
    this.addStepActionListeners(driverData);
  }

  private renderImageModal(imageSrc: string, title: string): void {
    if (!this.overlay) return;

    const content = this.createImageModalContent();
    content.innerHTML = this.getImageModalHTML(imageSrc, title);
    this.overlay.appendChild(content);
  }

  private renderConfirmationModal(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    if (!this.overlay) return;

    const content = this.createModalContent();
    content.innerHTML = this.getConfirmationHTML(title, message);
    this.overlay.appendChild(content);

    // Add event listeners
    const confirmBtn = content.querySelector('#confirm-btn');
    const cancelBtn = content.querySelector('#cancel-btn');

    confirmBtn?.addEventListener('click', () => {
      onConfirm();
      this.close();
    });

    cancelBtn?.addEventListener('click', () => {
      if (onCancel) onCancel();
      this.close();
    });
  }

  private createModalContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'modal-content animate-scale-in';
    return content;
  }

  private createImageModalContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'image-modal-content animate-scale-in';
    return content;
  }

  private getDriverDetailsHTML(driverData: any): string {
    const { driver, verification } = driverData;
    
    return `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Driver Verification Details</h2>
          <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="mb-6">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-2xl font-bold text-primary-600">
                ${driver.firstName.charAt(0)}${driver.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">${driver.firstName} ${driver.lastName}</h3>
              <p class="text-gray-600">${driver.email}</p>
              <p class="text-gray-600">${driver.phone}</p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Verification Progress</span>
              <span class="text-sm text-gray-600">${verification.progress.completed}/${verification.progress.total} steps</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-primary-500 h-2 rounded-full transition-all duration-300" style="width: ${verification.progress.percentage}%"></div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-gray-900">Verification Steps</h4>
          ${this.getVerificationStepsHTML(verification)}
        </div>

        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="flex space-x-4">
            <button id="approve-all-btn" class="btn btn-success">
              Approve All Steps
            </button>
            <button id="reject-all-btn" class="btn btn-danger">
              Reject All Steps
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private getVerificationStepsHTML(verification: any): string {
    const steps = [
      'profilePhoto', 'phoneVerified', 'driverLicense', 
      'vehiclePhotos', 'vehiclePlate', 'insurance', 'backgroundCheck'
    ];

    return steps.map(step => {
      const stepConfig = this.getStepConfig(step);
      const stepStatus = this.getStepStatus(step, verification);
      const hasDocuments = this.hasDocumentsForStep(step, verification.documents);

      return `
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">${stepConfig.icon}</span>
                <div>
                  <h5 class="font-medium text-gray-900">${stepConfig.name}</h5>
                  <p class="text-sm text-gray-600">${stepConfig.description}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="badge ${stepStatus.className}">${stepStatus.badge}</span>
                ${this.getStepActionsHTML(step, stepStatus.status, hasDocuments)}
              </div>
            </div>
            ${this.getStepDocumentsHTML(step, verification.documents)}
          </div>
        </div>
      `;
    }).join('');
  }

  private getStepConfig(step: string): { name: string; icon: string; description: string } {
    const configs: Record<string, { name: string; icon: string; description: string }> = {
      profilePhoto: { name: 'Profile Photo', icon: '👤', description: 'Driver profile picture' },
      phoneVerified: { name: 'Phone Verification', icon: '📱', description: 'Phone number verified' },
      driverLicense: { name: 'Driver License', icon: '🆔', description: 'Driver license document' },
      vehiclePhotos: { name: 'Vehicle Photos', icon: '🚗', description: 'Front, back, left, right, interior photos' },
      vehiclePlate: { name: 'License Plate', icon: '🔢', description: 'Vehicle license plate photo' },
      insurance: { name: 'Insurance', icon: '📄', description: 'Vehicle insurance document' },
      backgroundCheck: { name: 'Background Check', icon: '🔍', description: 'Background check consent' }
    };
    return configs[step] || { name: step, icon: '📋', description: 'Verification step' };
  }

  private getStepStatus(step: string, verification: any): { status: string; badge: string; className: string } {
    const submissionStatus = verification.submissionStatus?.[step];
    
    if (submissionStatus?.status === 'approved') {
      return { status: 'approved', badge: '✅ Approved', className: 'badge-success' };
    } else if (submissionStatus?.status === 'rejected') {
      return { status: 'rejected', badge: '❌ Rejected', className: 'badge-danger' };
    } else if (submissionStatus?.submitted && submissionStatus.status === 'pending') {
      return { status: 'submitted', badge: '📤 Submitted for Review', className: 'badge-info' };
    } else if (step === 'backgroundCheck' && verification.backgroundCheckConsent) {
      // Special case for background check - if consent is given, it's ready for review
      return { status: 'submitted', badge: '📤 Ready for Review', className: 'badge-info' };
    } else {
      return { status: 'pending', badge: '⏳ Pending Upload', className: 'badge-warning' };
    }
  }

  private hasDocumentsForStep(step: string, documents: any): boolean {
    switch (step) {
      case 'profilePhoto':
        return !!documents.profilePhoto;
      case 'driverLicense':
        return !!documents.driverLicense;
      case 'vehiclePhotos':
        return !!(documents.vehicleFront && documents.vehicleBack && documents.vehicleLeft && documents.vehicleRight && documents.vehicleInterior);
      case 'vehiclePlate':
        return !!documents.licensePlate;
      case 'insurance':
        return !!documents.insurance;
      case 'backgroundCheck':
        return true; // Background check is consent-based, not document-based
      default:
        return false;
    }
  }

  private getStepActionsHTML(step: string, status: string, hasDocuments: boolean): string {
    if (status === 'approved') {
      return '<span class="text-sm text-secondary-600">✅ Step approved</span>';
    } else if (status === 'rejected') {
      return `
        <button class="btn btn-sm btn-success approve-step-btn" data-step="${step}">
          Approve Step
        </button>
      `;
    } else if (status === 'submitted' || hasDocuments) {
      return `
        <button class="btn btn-sm btn-success approve-step-btn" data-step="${step}">
          Approve Step
        </button>
        <button class="btn btn-sm btn-danger reject-step-btn" data-step="${step}">
          Reject Step
        </button>
      `;
    } else {
      return '<span class="text-sm text-gray-500">⏳ Waiting for documents</span>';
    }
  }

  private getStepDocumentsHTML(step: string, documents: any): string {
    let imagesHTML = '';
    
    switch (step) {
      case 'profilePhoto':
        if (documents.profilePhoto) {
          imagesHTML = `
            <div class="mt-3">
              <img src="${documents.profilePhoto}" alt="Profile Photo" class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.profilePhoto}', 'Profile Photo')">
            </div>
          `;
        }
        break;
      case 'driverLicense':
        if (documents.driverLicense) {
          imagesHTML = `
            <div class="mt-3">
              <img src="${documents.driverLicense}" alt="Driver License" class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.driverLicense}', 'Driver License')">
            </div>
          `;
        }
        break;
      case 'vehiclePhotos':
        if (documents.vehicleFront || documents.vehicleBack || documents.vehicleLeft || documents.vehicleRight || documents.vehicleInterior) {
          imagesHTML = `
            <div class="mt-3 grid grid-cols-2 gap-2">
              ${documents.vehicleFront ? `
                <img src="${documents.vehicleFront}" alt="Vehicle Front" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.vehicleFront}', 'Vehicle - Front')">
              ` : ''}
              ${documents.vehicleBack ? `
                <img src="${documents.vehicleBack}" alt="Vehicle Back" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.vehicleBack}', 'Vehicle - Back')">
              ` : ''}
              ${documents.vehicleLeft ? `
                <img src="${documents.vehicleLeft}" alt="Vehicle Left" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.vehicleLeft}', 'Vehicle - Left')">
              ` : ''}
              ${documents.vehicleRight ? `
                <img src="${documents.vehicleRight}" alt="Vehicle Right" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.vehicleRight}', 'Vehicle - Right')">
              ` : ''}
              ${documents.vehicleInterior ? `
                <img src="${documents.vehicleInterior}" alt="Vehicle Interior" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.vehicleInterior}', 'Vehicle - Interior')">
              ` : ''}
            </div>
          `;
        }
        break;
      case 'vehiclePlate':
        if (documents.licensePlate) {
          imagesHTML = `
            <div class="mt-3">
              <img src="${documents.licensePlate}" alt="License Plate" class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.licensePlate}', 'License Plate')">
            </div>
          `;
        }
        break;
      case 'insurance':
        if (documents.insurance) {
          imagesHTML = `
            <div class="mt-3">
              <img src="${documents.insurance}" alt="Insurance Document" class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onclick="modalManager.showImageModal('${documents.insurance}', 'Insurance Document')">
            </div>
          `;
        }
        break;
      case 'backgroundCheck':
        // Background check is consent-based, show consent status
        imagesHTML = `
          <div class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Background Check Consent</h3>
                <p class="text-sm text-blue-600">Driver has provided consent for background check verification</p>
              </div>
            </div>
          </div>
        `;
        break;
    }
    
    return imagesHTML;
  }

  private getImageModalHTML(imageSrc: string, title: string): string {
    return `
      <div class="relative">
        <button id="close-image-modal" class="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div class="text-center mb-4">
          <h3 class="text-xl font-semibold text-white">${title}</h3>
        </div>
        <img src="${imageSrc}" alt="${title}" class="max-w-full max-h-[80vh] rounded-lg shadow-strong">
      </div>
    `;
  }

  private getConfirmationHTML(title: string, message: string): string {
    return `
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">${title}</h2>
          <button id="close-confirmation-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p class="text-gray-600 mb-6">${message}</p>
        <div class="flex space-x-4 justify-end">
          <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
          <button id="confirm-btn" class="btn btn-danger">Confirm</button>
        </div>
      </div>
    `;
  }

  private addStepActionListeners(driverData: any): void {
    // Add event listeners for step action buttons
    const approveStepBtns = this.overlay?.querySelectorAll('.approve-step-btn');
    const rejectStepBtns = this.overlay?.querySelectorAll('.reject-step-btn');

    approveStepBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = (e.target as HTMLElement).getAttribute('data-step');
        const driverId = driverData.driver?.id; // Backend sends 'id', not '_id'
        
        if (step && driverId) {
          this.handleStepApproval(driverId, step);
        } else {
          console.error('Missing step or driver ID:', { step, driverId, driverData });
        }
      });
    });

    rejectStepBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = (e.target as HTMLElement).getAttribute('data-step');
        const driverId = driverData.driver?.id; // Backend sends 'id', not '_id'
        
        if (step && driverId) {
          this.handleStepRejection(driverId, step);
        } else {
          console.error('Missing step or driver ID:', { step, driverId, driverData });
        }
      });
    });

    // Add close button listener
    const closeBtn = this.overlay?.querySelector('#close-modal');
    closeBtn?.addEventListener('click', () => {
      this.close();
    });
  }

  private async handleStepApproval(driverId: string, step: string): Promise<void> {
    if (!this.apiService) {
      console.error('API service not available');
      return;
    }

    try {
      const response = await this.apiService.approveStep(driverId, step);
      if (response.success) {
        // Show success notification
        if (window.notificationManager) {
          window.notificationManager.success(`Step "${step}" approved successfully!`);
        }
        
        // Close modal and refresh data
        this.close();
        
        // Trigger refresh if available
        if (window.adminDashboard) {
          await window.adminDashboard.refreshData();
        }
      } else {
        if (window.notificationManager) {
          window.notificationManager.error(response.message || 'Failed to approve step');
        }
      }
    } catch (error) {
      console.error('Failed to approve step:', error);
      if (window.notificationManager) {
        window.notificationManager.error('Failed to approve step');
      }
    }
  }

  private async handleStepRejection(driverId: string, step: string): Promise<void> {
    if (!this.apiService) {
      console.error('API service not available');
      return;
    }

    const reason = prompt(`Please provide a reason for rejecting "${step}":`);
    if (!reason || reason.trim() === '') {
      return;
    }

    try {
      const response = await this.apiService.rejectStep(driverId, step, reason.trim());
      if (response.success) {
        // Show success notification
        if (window.notificationManager) {
          window.notificationManager.success(`Step "${step}" rejected successfully!`);
        }
        
        // Close modal and refresh data
        this.close();
        
        // Trigger refresh if available
        if (window.adminDashboard) {
          await window.adminDashboard.refreshData();
        }
      } else {
        if (window.notificationManager) {
          window.notificationManager.error(response.message || 'Failed to reject step');
        }
      }
    } catch (error) {
      console.error('Failed to reject step:', error);
      if (window.notificationManager) {
        window.notificationManager.error('Failed to reject step');
      }
    }
  }
}

// Global modal instance
export const modalManager = new ModalManager();
