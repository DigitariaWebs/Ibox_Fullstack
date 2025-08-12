// Fix database script - removes firebaseUid unique index
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List current indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check if firebaseUid index exists
    const firebaseUidIndex = indexes.find(idx => idx.name === 'firebaseUid_1');
    if (firebaseUidIndex) {
      console.log('Dropping firebaseUid_1 index...');
      await usersCollection.dropIndex('firebaseUid_1');
      console.log('✅ Successfully dropped firebaseUid_1 index');
    } else {
      console.log('No firebaseUid_1 index found');
    }

    // List remaining indexes
    const remainingIndexes = await usersCollection.indexes();
    console.log('Remaining indexes:', remainingIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    await mongoose.disconnect();
    console.log('✅ Database fix completed');
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase();