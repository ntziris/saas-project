const jwt = require('jsonwebtoken');
const CustomError = require('../utils/CustomError');

const JWT_SECRET = process.env.JWT_SECRET || 'saas24-06-jwt-key';

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    throw new CustomError('Access denied', 401);
  }

  try {
    const decodedUser = jwt.verify(token, JWT_SECRET);
    req.user = decodedUser;
    next();
  } catch (error) {
    throw new CustomError('Invalid token', 401);
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    throw new CustomError('Forbidden', 403);
  }
};
