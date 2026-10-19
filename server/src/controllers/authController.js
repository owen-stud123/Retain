import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { httpError, isNonEmptyString, isValidEmail } from '../utils/validation.js';

const MAX_NAME_LENGTH = 80;
const MAX_PASSWORD_LENGTH = 128;

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

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || typeof password !== 'string' || !password) {
    throw httpError('Name, email and password are required');
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    throw httpError(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }

  if (!isValidEmail(email)) {
    throw httpError('Enter a valid email address');
  }

  if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
    throw httpError(`Password must be between 8 and ${MAX_PASSWORD_LENGTH} characters`);
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

  if (!isNonEmptyString(email) || typeof password !== 'string' || !password) {
    throw httpError('Email and password are required');
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