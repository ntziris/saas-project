const express = require('express');
const router = express.Router();
const os = require('os');
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const asyncErrorHandler = require('../utils/asyncErrorHandler');

/**
 * @swagger
 * /health/:
 *   get:
 *     summary: Health check and system info
 *     description: Performs a health check and returns system information.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check and system info returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "UP"
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 memoryUsage:
 *                   type: object
 *                   description: Memory usage of the application
 *                 cpuLoad:
 *                   type: array
 *                   items:
 *                     type: number
 *                   description: CPU load averages over 1, 5, and 15 minutes
 *                 freeMemory:
 *                   type: number
 *                   description: Free system memory in bytes
 *                 totalMemory:
 *                   type: number
 *                   description: Total system memory in bytes
 *                 platform:
 *                   type: string
 *                   description: OS platform
 *                 arch:
 *                   type: string
 *                   description: CPU architecture
 *                 cpuCores:
 *                   type: integer
 *                   description: Number of CPU cores
 *       500:
 *         description: Internal server error
 */
router.get('/health/',
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  (req, res) => {
  const healthStatus = {
    status: 'UP',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuLoad: os.loadavg(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem(),
    platform: os.platform(),
    arch: os.arch(),
    cpuCores: os.cpus().length,
  };
  res.status(200).json(healthStatus);
});


/**
 * @swagger
 * /validate-token:
 *   get:
 *     summary: Validate a token
 *     description: Checks if the provided token is valid.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object              
 *       401:
 *         description: Invalid or missing token
 */
router.get('/validate-token', AuthMiddleware.authenticateToken, (req, res) => {
  res.status(200).json({ valid: true, user: req.user });
});

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up a user
 *     description: Creates a user returns a token.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                  type: string
 *     responses:
 *       200:
 *         description: Creation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post('/signup', asyncErrorHandler(UserController.signUp));

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Sign in a user
 *     description: Authenticates a user and returns a token.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/signin', asyncErrorHandler(UserController.signIn));

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get user status
 *     description: Retrieves the status of the authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user status
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/status',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(UserController.getMyStatus)
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users (admin access only).
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/', // Get All Users
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(UserController.getAllUsers)
);

/**
 * @swagger
 * /{userId}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieves a single user by ID (admin access only).
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User data
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/:userId', // Get User by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(UserController.getSingleUser)
);

/**
 * @swagger
 * /{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by ID (admin access only).
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden (not an admin)
 */
router.delete(
  '/:userId', // Delete User by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(UserController.deleteUser)
);

module.exports = router;