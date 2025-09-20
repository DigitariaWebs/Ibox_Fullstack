import { NotificationState } from './types.js';

export class NotificationManager {
  private container: HTMLElement | null = null;
  private notifications: Map<string, NotificationState> = new Map();

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
  }

  show(
    message: string,
    type: NotificationState['type'] = 'info',
    duration: number = 5000
  ): string {
    const id = this.generateId();
    const notification: NotificationState = {
      show: true,
      type,
      message,
      duration,
    };

    this.notifications.set(id, notification);
    this.renderNotification(id, notification);

    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  success(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): string {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  }

  hide(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.add('animate-slide-out-right');
      setTimeout(() => {
        element.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  clear(): void {
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
  }

  private renderNotification(id: string, notification: NotificationState): void {
    if (!this.container) return;

    const element = document.createElement('div');
    element.id = `notification-${id}`;
    element.className = this.getNotificationClasses(notification.type);
    element.innerHTML = this.getNotificationHTML(notification);

    // Add click to dismiss
    element.addEventListener('click', () => {
      this.hide(id);
    });

    this.container.appendChild(element);

    // Trigger animation
    setTimeout(() => {
      element.classList.add('animate-slide-in-right');
    }, 10);
  }

  private getNotificationClasses(type: NotificationState['type']): string {
    const baseClasses = 'max-w-sm w-full bg-white shadow-strong rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-out border';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-l-secondary-500 bg-gradient-to-r from-secondary-50 to-white`;
      case 'error':
        return `${baseClasses} border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white`;
      case 'warning':
        return `${baseClasses} border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white`;
      case 'info':
        return `${baseClasses} border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white`;
      default:
        return `${baseClasses} border-l-4 border-l-gray-500 bg-gradient-to-r from-gray-50 to-white`;
    }
  }

  private getNotificationHTML(notification: NotificationState): string {
    const icon = this.getIcon(notification.type);
    const iconBg = this.getIconBackground(notification.type);

    return `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 ${iconBg} rounded-full flex items-center justify-center">
              <span class="text-sm">${icon}</span>
            </div>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900 leading-5">
              ${notification.message}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button class="bg-white rounded-full p-1 inline-flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200">
              <span class="sr-only">Close</span>
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private getIconBackground(type: NotificationState['type']): string {
    switch (type) {
      case 'success':
        return 'bg-secondary-100 text-secondary-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'info':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  private getIcon(type: NotificationState['type']): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  }


  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Global notification instance
export const notifications = new NotificationManager();
