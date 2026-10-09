import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function createToken(userId) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '7d' });
}

export async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    const error = new Error('Name, email and password are required');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password
  });

  res.status(201).json({
    token: createToken(user._id),
    user: serializeUser(user)
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const passwordMatches = user ? await user.comparePassword(password) : false;

  if (!user || !passwordMatches) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  res.json({
    token: createToken(user._id),
    user: serializeUser(user)
  });
}

export function me(req, res) {
  res.json({
    token: createToken(req.user._id),
    user: serializeUser(req.user)
  });
}