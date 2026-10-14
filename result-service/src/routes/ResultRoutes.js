const express = require('express');
const router = express.Router();
const ResultController = require('../controllers/ResultController');
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

/**
 * @swagger
 * /{submissionId}:
 *   get:
 *     summary: Get results by submission ID
 *     description: Retrieves results for a specific submission based on the submission ID for authenticated users.
 *     tags: [Result]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: submissionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission to get results for
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Submission not found
 */
router.get(
  '/:submissionId',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(ResultController.getResultsBySubmissionId)
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all results
 *     description: Retrieves all results (admin access only).
 *     tags: [Result]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/',
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(ResultController.getAllResults)
);

module.exports = router;
