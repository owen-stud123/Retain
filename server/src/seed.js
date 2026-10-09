import 'dotenv/config';
import { connectDB } from './config/db.js';
import Budget from './models/Budget.js';
import Category from './models/Category.js';
import Expense from './models/Expense.js';
import User from './models/User.js';
import { getCurrentMonth } from './utils/month.js';

const demoEmail = 'demo@retain.app';
const demoPassword = 'Password123!';
const categoryNames = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health'];
const paymentMethods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'];

async function ensureUser({ name, email, password, role }) {
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ name, email, password, role });
  } else {
    user.name = name;
    user.password = password;
    user.role = role;
  }

  await user.save();
  return user;
}

async function seed() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  await connectDB();

  const admin = await ensureUser({
    name: 'Retain Admin',
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
  });
  const demoUser = await ensureUser({
    name: 'Demo User',
    email: demoEmail,
    password: demoPassword,
    role: 'user'
  });

  const categories = await Promise.all(
    categoryNames.map((name) => Category.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, isDefault: false } },
      { new: true, upsert: true, collation: { locale: 'en', strength: 2 } }
    ))
  );
  const uncategorized = await Category.findOne({ isDefault: true });
  const allCategories = [...categories, uncategorized];

  await Expense.deleteMany({ user: demoUser._id });
  const expenses = Array.from({ length: 45 }, (_, index) => ({
    user: demoUser._id,
    title: `Demo expense ${index + 1}`,
    amount: Number((15 + ((index * 17) % 185) + (index % 4) * 0.25).toFixed(2)),
    category: allCategories[index % allCategories.length]._id,
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    paymentMethod: paymentMethods[index % paymentMethods.length],
    notes: index % 3 === 0 ? 'Seeded demo expense' : undefined
  }));
  await Expense.insertMany(expenses);

  await Budget.findOneAndUpdate(
    { user: demoUser._id, month: getCurrentMonth() },
    { amount: 2500 },
    { upsert: true, new: true, runValidators: true }
  );

  console.log(`Seeded admin ${admin.email}, demo user ${demoEmail}, and ${expenses.length} expenses`);
}

try {
  await seed();
} catch (error) {
  console.error('Seed failed', error);
  process.exitCode = 1;
} finally {
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}