// Load environment variables before anything else
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root directory
dotenv.config({ 
  path: path.join(__dirname, '..', '.env')
});

// Verify critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set in .env file');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env at:', path.join(__dirname, '..', '.env'));
  console.error('Environment variables loaded:', Object.keys(process.env).filter(key => key.startsWith('JWT')));
  process.exit(1);
}

// Now import and start the app
import('./app.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});