const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticsController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const os = require('os');


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

// Middleware for all routes: authentication and admin access
const authAdminMiddleware = [
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin
];

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all analytics
 *     description: Retrieves all analytics data (admin access only).
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/', // Get all Analytics
  authAdminMiddleware,
  asyncErrorHandler(AnalyticsController.getAnalytics)
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users count
 *     description: Retrieves the total number of users (admin access only).
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the users count
 *         content:
 *           application/json:
 *             schema:
 *               type: object

 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/users', // Get Users Count
  authAdminMiddleware,
  asyncErrorHandler(AnalyticsController.getUsersCount)
);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get transactions count
 *     description: Retrieves the total number of transactions (admin access only).
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the transactions count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/transactions', // Get Transactions Count
  authAdminMiddleware,
  asyncErrorHandler(AnalyticsController.getTransactionsCount)
);

/**
 * @swagger
 * /submissions:
 *   get:
 *     summary: Get submissions count
 *     description: Retrieves the total number of submissions (admin access only).
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the submissions count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/submissions', // Get Submissions Count
  authAdminMiddleware,
  asyncErrorHandler(AnalyticsController.getSubmissionsCount)
);

/**
 * @swagger
 * /results:
 *   get:
 *     summary: Get results count
 *     description: Retrieves the total number of results (admin access only).
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the results count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/results', // Get Results Count
  authAdminMiddleware,
  asyncErrorHandler(AnalyticsController.getResultsCount)
);

module.exports = router;
