import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin.app();
    }

    // Parse the private key (replace \n with actual newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing Firebase configuration in environment variables');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

// Initialize Firebase on module load
const firebaseApp = initializeFirebase();

// Export Firebase Admin instance
export default admin;

// Export auth instance for convenience
export const auth = admin.auth();

// Verify Firebase ID Token middleware
export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid Firebase token');
  }
};

// Get or create user from Firebase token
export const getOrCreateFirebaseUser = async (decodedToken) => {
  try {
    const { uid, email, name, picture } = decodedToken;
    
    // Get additional user info from Firebase
    const firebaseUser = await auth.getUser(uid);
    
    return {
      firebaseUid: uid,
      email: email || firebaseUser.email,
      displayName: name || firebaseUser.displayName,
      photoURL: picture || firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      emailVerified: firebaseUser.emailVerified,
      provider: 'google',
    };
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    throw error;
  }
};