import { Driver, VerificationProgress, SubmissionStatus } from './types.js';

export class Utils {
  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  static formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const d = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  static calculateVerificationProgress(driver: Driver): VerificationProgress {
    const transporterDetails = driver.transporterDetails || {};
    const verificationDocuments = (transporterDetails as any).verificationDocuments || {};
    
    const completedSteps = {
      profilePhoto: !!(verificationDocuments.profilePhoto || driver.profilePicture),
      phoneVerified: !!driver.isPhoneVerified,
      driverLicense: !!verificationDocuments.driverLicense,
      vehiclePhotos: !!(verificationDocuments.vehicleFront && verificationDocuments.vehicleBack && 
                        verificationDocuments.vehicleLeft && verificationDocuments.vehicleRight && 
                        verificationDocuments.vehicleInterior),
      vehiclePlate: !!verificationDocuments.licensePlate,
      insurance: !!verificationDocuments.insurance,
      backgroundCheck: !!(transporterDetails as any).backgroundCheckConsent,
    };

    const totalSteps = Object.keys(completedSteps).length;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const percentage = Math.round((completedCount / totalSteps) * 100);

    return {
      completed: completedCount,
      total: totalSteps,
      percentage,
      steps: completedSteps,
    };
  }

  static getStepStatus(step: string, submissionStatus: SubmissionStatus, completed: boolean, backgroundCheckConsent?: boolean): {
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    badge: string;
    className: string;
  } {
    const stepStatus = submissionStatus[step];
    
    if (stepStatus?.status === 'approved') {
      return {
        status: 'approved',
        badge: '✅ Approved',
        className: 'status-approved',
      };
    } else if (stepStatus?.status === 'rejected') {
      return {
        status: 'rejected',
        badge: '❌ Rejected',
        className: 'status-rejected',
      };
    } else if (step === 'backgroundCheck' && backgroundCheckConsent) {
      // Special case for background check - if consent is given, it's ready for review
      return {
        status: 'submitted',
        badge: '📤 Ready for Review',
        className: 'status-submitted',
      };
    } else if (stepStatus?.submitted && stepStatus.status === 'pending') {
      return {
        status: 'submitted',
        badge: '📤 Submitted for Review',
        className: 'status-submitted',
      };
    } else if (completed) {
      return {
        status: 'submitted',
        badge: '📤 Ready for Review',
        className: 'status-submitted',
      };
    } else {
      return {
        status: 'pending',
        badge: '⏳ Pending Upload',
        className: 'status-pending',
      };
    }
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  }

  static downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}
