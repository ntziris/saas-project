const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/CustomError');
const RabbitMQService = require('../services/RabbitMQService');

const JWT_SECRET = process.env.JWT_SECRET || 'saas24-06-jwt-key';

// Helper function to format user data
const formatUserResponse = (user) => {
  const response = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    credits: user.credits,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return response;
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find({}, '-passwordHash -__v');
  res.json(users.map((user) => formatUserResponse(user)));
};

exports.getSingleUser = async (req, res) => {
  const user = await User.findById(req.params.userId, '-passwordHash -__v');
  if (!user) {
    throw new CustomError('User not found', 404);
  }
  res.json(formatUserResponse(user));
};

exports.signUp = async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User already exists', 400);
  }

  // Check Password Length
  if (password.length < 6) {
    throw new CustomError('Invalid input data: Password must be at least 6 characters long', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create new user
  const user = new User({
    email,
    passwordHash,
    name,
    role: { name: 'user' },
    credits: 0,
  });

  await user.save();

  // Publish user created event
  await RabbitMQService.publishUserCreatedEvent(user);

  // Create JWT token
  const token = jwt.sign({ userId: user._id, role: user.role.name }, JWT_SECRET, {
    expiresIn: '1d',
  });

  res.status(201).json({
    message: 'User created successfully',
    token,
    userId: user._id,
  });
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Create JWT token
  const token = jwt.sign({ userId: user._id, role: user.role.name }, JWT_SECRET, {
    expiresIn: '1d',
  });

  res.json({
    message: 'Signed in successfully',
    token,
    is_admin: user.isAdmin(),
  });
};

exports.getMyStatus = async (req, res) => {
  // Get the userId from the authenticated user (jwt) in the request
  const userId = req.user.userId;

  const user = await User.findById(userId, '-passwordHash -__v');
  if (!user) {
    throw new CustomError('User not found', 404);
  }
  res.json(formatUserResponse(user));
};

exports.deleteUser = async (req, res) => {
  const userIdToDelete = req.params.userId;

  // Check if the user to be deleted exists
  const userToDelete = await User.findById(userIdToDelete);
  if (!userToDelete) {
    throw new CustomError('User not found', 404);
  }

  // Prevent deleting the last admin
  if (userToDelete.isAdmin()) {
    const adminCount = await User.countDocuments({ 'role.name': 'admin' });
    if (adminCount <= 1) {
      throw new CustomError('Cannot delete the last admin user', 400);
    }
  }

  // Delete the user
  await User.findByIdAndDelete(userIdToDelete);

  res.json({ message: 'User deleted successfully' });
};
