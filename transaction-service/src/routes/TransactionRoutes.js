const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
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
 * /:
 *   post:
 *     summary: Create a new transaction
 *     description: Creates a new transaction for the authenticated user.
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionCost:
 *                 type: integer
 *               creditsPurchased:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  '/',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(TransactionController.postTransaction)
);

/**
 * @swagger
 * /my-transactions:
 *   get:
 *     summary: Get my transactions
 *     description: Retrieves the list of transactions made by the authenticated user.
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-transactions',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(TransactionController.getMyTransactions)
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieves a list of all transactions (admin access only).
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/', // Get all Transactions
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(TransactionController.getAllTransactions)
);

/**
 * @swagger
 * /{transactionId}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieves a transaction by its ID (admin access only).
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction
 *     responses:
 *       200:
 *         description: Transaction data
 *         content:
 *           application/json:
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/:transactionId', // Get transaction by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(TransactionController.getSingleTransaction)
);

/**
 * @swagger
 * /{transactionId}:
 *   delete:
 *     summary: Delete transaction
 *     description: Deletes a transaction by ID (admin access only).
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to delete
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       403:
 *         description: Forbidden (not an admin)
 */
router.delete(
  '/:transactionId', // Delete transaction by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(TransactionController.deleteTransaction)
);

/**
 * @swagger
 * /customer/{customerId}:
 *   get:
 *     summary: Get transactions by customer ID
 *     description: Retrieves all transactions made by a specific customer (admin access only).
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the customer
 *     responses:
 *       200:
 *         description: List of transactions for the customer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/customer/:customerId', // Get all  trasaction a customer has made, by customerId
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(TransactionController.getCustomerTransactions)
);

module.exports = router;
