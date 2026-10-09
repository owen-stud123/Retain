import mongoose from 'mongoose';
import Category from '../models/Category.js';

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(mongoUri);
  await Category.updateOne(
    { name: 'Uncategorized' },
    { $setOnInsert: { name: 'Uncategorized', isDefault: true } },
    { upsert: true, collation: { locale: 'en', strength: 2 } }
  );
  console.log('MongoDB connected');
}