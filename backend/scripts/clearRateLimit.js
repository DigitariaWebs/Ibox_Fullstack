import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function clearRateLimitForUser(userEmail) {
  try {
    // Find all rate limit keys for this user
    const keys = await redis.keys(`rate_limit:*:${userEmail}*`);
    
    if (keys.length === 0) {
      console.log('❌ No rate limit keys found for user:', userEmail);
      return;
    }
    
    console.log(`🔑 Found ${keys.length} rate limit keys for user ${userEmail}:`);
    keys.forEach(key => console.log('  -', key));
    
    // Delete all rate limit keys
    for (const key of keys) {
      await redis.del(key);
      console.log('✅ Deleted:', key);
    }
    
    console.log('\n✨ All rate limits cleared for user:', userEmail);
    
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
  } finally {
    redis.disconnect();
  }
}

// Get user email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node clearRateLimit.js <user-email>');
  console.log('Example: node clearRateLimit.js achrefarabi414@gmail.com');
  process.exit(1);
}

clearRateLimitForUser(userEmail);
