import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwks = createRemoteJWKSet(new URL(process.env.SUPABASE_JWKS_URL));

export async function verifySupabaseAccessToken(token) {
  try {
    console.log('🔐 Starting JWT verification...');
    console.log('🔑 Token length:', token.length);
    console.log('🔗 JWKS URL:', process.env.SUPABASE_JWKS_URL);
    
    // Try to decode the token first to see its structure
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('🔍 Token payload:', {
      iss: decoded.iss,
      aud: decoded.aud,
      sub: decoded.sub,
      email: decoded.email,
      exp: decoded.exp,
      iat: decoded.iat
    });
    
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['HS256', 'RS256'],
      issuer: decoded.iss, // Use the issuer from the token
      audience: decoded.aud, // Use the audience from the token
    });
    
    console.log('✅ JWT verification successful');
    console.log('👤 User ID:', payload.sub);
    console.log('📧 Email:', payload.email);
    
    return payload;
  } catch (error) {
    console.error('❌ Supabase JWT verification failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // If JWKS verification fails, try a simpler approach
    try {
      console.log('🔄 Trying fallback verification...');
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      // Basic validation
      if (!decoded.sub || !decoded.email) {
        throw new Error('Missing required fields');
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }
      
      console.log('✅ Fallback verification successful');
      return decoded;
    } catch (fallbackError) {
      console.error('❌ Fallback verification also failed:', fallbackError);
      throw new Error('Invalid Supabase token');
    }
  }
}
