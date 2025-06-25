import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserInput, LoginInput } from '../types';
import config from '../config/config';
import User from '../models/User';
import Folder from '../models/Folder';

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password }: UserInput = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }],
    });

    if (existingUser) {
      res
        .status(409)
        .json({ error: 'User with this email or username already exists' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create root folder for user
    const rootFolder = new Folder({
      name: 'My Drive',
      parentId: null,
      userId: user._id,
      children: [],
      path: '/My Drive',
      isRoot: true,
    });

    await rootFolder.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      config.jwtSecret,
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      // MongoDB duplicate key error
      res
        .status(409)
        .json({ error: 'User with this email or username already exists' });
      return;
    }
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      config.jwtSecret,
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { email },
      { new: true },
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
      },
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      res.status(409).json({ error: 'Email already taken' });
      return;
    }
    next(error);
  }
};
