# iBox Admin Dashboard

A modern, TypeScript-based admin dashboard for managing driver verifications in the iBox delivery platform.

## Features

- **Modern UI Design**: Clean, responsive interface built with Tailwind CSS
- **TypeScript**: Fully typed codebase for better development experience
- **Real-time Updates**: Live data refresh and notifications
- **Step-by-step Verification**: Granular control over driver verification process
- **Image Viewer**: Built-in modal for viewing verification documents
- **Search & Filter**: Advanced filtering and search capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **ES Modules**: Modern JavaScript module system
- **Fetch API**: Modern HTTP client
- **CSS Grid & Flexbox**: Modern layout techniques

## Project Structure

```
admin-dashboard/
├── src/
│   ├── app.ts              # Main application logic
│   ├── api.ts              # API service layer
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   ├── notifications.ts    # Notification system
│   ├── modal.ts            # Modal management
│   └── styles.css          # Tailwind CSS input
├── dist/
│   ├── index.html          # Main HTML template
│   ├── app.js              # Compiled TypeScript
│   └── styles.css          # Compiled CSS
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 5000

### Installation

1. Navigate to the admin dashboard directory:
   ```bash
   cd backend/admin-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Serve the dashboard:
   ```bash
   npm run serve
   ```

### Development

For development with auto-rebuild:

```bash
npm run dev
```

This will:
- Watch TypeScript files and recompile on changes
- Watch CSS files and rebuild Tailwind CSS
- Serve the dashboard on http://localhost:3000

## Usage

### Accessing the Dashboard

1. Open your browser and navigate to `http://localhost:3000`
2. Login with admin credentials:
   - Email: `admin@ibox.com`
   - Password: `IBOX23`

### Managing Driver Verifications

1. **View Statistics**: Dashboard shows total, pending, approved, and rejected drivers
2. **Search Drivers**: Use the search bar to find specific drivers
3. **Filter by Status**: Click filter buttons to show drivers by verification status
4. **View Details**: Click "View Details" to see complete verification information
5. **Approve/Reject**: Use action buttons to approve or reject drivers
6. **Step-by-step Review**: In the details modal, approve or reject individual verification steps

### Features Overview

#### Driver Cards
- Driver information and profile picture
- Verification progress bar
- Current verification status
- Quick action buttons

#### Verification Details Modal
- Complete driver information
- Step-by-step verification progress
- Document image viewer
- Individual step approval/rejection
- Bulk approval/rejection options

#### Image Viewer
- Full-screen document viewing
- High-quality image display
- Easy navigation and closing

#### Notifications
- Success, error, warning, and info notifications
- Auto-dismiss with customizable duration
- Click to dismiss manually

## API Integration

The dashboard integrates with the following backend endpoints:

- `POST /api/v1/auth/login` - Admin authentication
- `GET /api/v1/admin/verifications/stats` - Verification statistics
- `GET /api/v1/admin/verifications` - List all driver verifications
- `GET /api/v1/admin/verifications/:id` - Get driver verification details
- `POST /api/v1/admin/verifications/:id/approve` - Approve driver verification
- `POST /api/v1/admin/verifications/:id/reject` - Reject driver verification
- `POST /api/v1/admin/verifications/:id/approve-step` - Approve verification step
- `POST /api/v1/admin/verifications/:id/reject-step` - Reject verification step

## Customization

### Styling

The dashboard uses Tailwind CSS with custom configuration. Key customization points:

- **Colors**: Primary and secondary colors defined in `tailwind.config.js`
- **Components**: Custom component classes in `src/styles.css`
- **Animations**: Custom animations and transitions

### Configuration

- **API Base URL**: Modify `baseUrl` in `src/api.ts`
- **Notification Duration**: Adjust default duration in `src/notifications.ts`
- **Modal Behavior**: Customize modal settings in `src/modal.ts`

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security

- JWT token-based authentication
- Secure API communication
- Input validation and sanitization
- XSS protection through proper HTML escaping

## Performance

- Lazy loading of images
- Debounced search input
- Efficient DOM updates
- Minimal bundle size
- Optimized CSS with Tailwind's purge

## Contributing

1. Follow TypeScript best practices
2. Use meaningful variable and function names
3. Add proper error handling
4. Write clean, readable code
5. Test all functionality before submitting

## License

MIT License - see LICENSE file for details.
