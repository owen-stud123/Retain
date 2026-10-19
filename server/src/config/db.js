import mongoose from 'mongoose';
import Category from '../models/Category.js';

// mongodb+srv:// addresses need a DNS SRV lookup before connecting. Some local networks and
// DNS resolvers refuse or drop SRV queries; that is a machine/network problem, not an app bug.
function explainConnectionError(error, mongoUri) {
  const isSrvUri = mongoUri.startsWith('mongodb+srv://');
  const isSrvLookupFailure = error?.syscall === 'querySrv' || /querySrv|_mongodb\._tcp/i.test(error?.message || '');

  if (isSrvUri && isSrvLookupFailure) {
    return [
      'Could not resolve the MongoDB Atlas SRV record (DNS lookup failed).',
      'This usually means the local network or DNS server is blocking SRV queries.',
      'Fix it on this machine by switching to a different DNS resolver, or use the',
      'standard (non-SRV) "mongodb://" connection string from Atlas in MONGO_URI.',
      'See "Troubleshooting" in the README.'
    ].join(' ');
  }

  return null;
}

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    const hint = explainConnectionError(error, mongoUri);
    if (hint) console.error(hint);
    throw error;
  }

  await Category.updateOne(
    { name: 'Uncategorized' },
    { $setOnInsert: { name: 'Uncategorized', isDefault: true } },
    { upsert: true, collation: { locale: 'en', strength: 2 } }
  );
  console.log('MongoDB connected');
}
