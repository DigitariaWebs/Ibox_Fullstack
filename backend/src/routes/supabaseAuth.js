import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifySupabaseAccessToken } from '../auth/supabaseVerifier.js';
import User from '../models/User.js';

const router = Router();

// This route should NOT be protected by authentication middleware
// since it's the login endpoint that receives Supabase tokens

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Supabase routes are working!' });
});

function signAppTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId }, 
    process.env.APP_JWT_SECRET, 
    { expiresIn: process.env.APP_JWT_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, typ: 'refresh' }, 
    process.env.APP_REFRESH_SECRET, 
    { expiresIn: process.env.APP_REFRESH_EXPIRES || '30d' }
  );
  return { accessToken, refreshToken };
}

router.post('/login', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken' });
    }

    console.log('🔐 Verifying Supabase token...');
    const payload = await verifySupabaseAccessToken(accessToken);
    const supabaseUserId = String(payload.sub);
    const email = payload.email;

    console.log('✅ Supabase token verified for user:', email);

    // First, check if user exists by email (regardless of provider)
    let user = await User.findOne({ email: email });
    
    if (user) {
      // User exists - connect Supabase account to existing user
      console.log('👤 Existing user found, connecting Supabase account:', email);
      
      user.provider = 'supabase';
      user.providerId = supabaseUserId;
      user.profilePicture = payload.user_metadata?.avatar_url || user.profilePicture;
      user.isVerified = true;
      user.lastLogin = new Date();
      
      // Update name if not already set
      if (!user.firstName && payload.user_metadata?.full_name) {
        const nameParts = payload.user_metadata.full_name.split(' ');
        user.firstName = nameParts[0] || '';
        user.lastName = nameParts.slice(1).join(' ') || '';
      }
      
      await user.save();
      console.log('✅ Supabase account connected to existing user');
      
    } else {
      // User doesn't exist - create new user
      console.log('👤 Creating new user:', email);
      
      const newUserData = {
        email,
        provider: 'supabase',
        providerId: supabaseUserId,
        firstName: payload.user_metadata?.full_name?.split(' ')[0] || 'User',
        lastName: payload.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User',
        profilePicture: payload.user_metadata?.avatar_url || '',
        isVerified: true,
        lastLogin: new Date(),
        userType: 'customer', // Default user type
        createdAt: new Date(),
        // Supabase users don't need password or phone
        password: 'supabase_user_no_password', // Dummy password for validation
        phone: '+1000000000', // Dummy phone for Supabase users
      };
      
      user = new User(newUserData);
      await user.save();
      console.log('✅ New user created:', email);
    }

    const tokens = signAppTokens(String(user._id));
    
    res.json({
      success: true,
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType || 'customer',
        profilePicture: user.profilePicture
      }
    });
  } catch (e) {
    console.error('❌ Supabase login error:', e);
    res.status(401).json({ 
      success: false,
      error: 'Invalid Supabase token',
      details: e.message 
    });
  }
});

export default router;
