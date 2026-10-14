const express = require("express");
const router = express.Router();
const SubmissionController = require("../controllers/SubmissionController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
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
 *     summary: Create a new submission
 *     description: Creates a new submission for the authenticated user.
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
    *             name:
    *               type: string
    *             totalCost:
    *               type: integer
    *             creatorId:
    *               type: string
    *             solverModelId:
    *               type: string
    *             tasks:
    *               type: array
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/",
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SubmissionController.postSubmission)
);

/**
 * @swagger
 * /my-submissions:
 *   get:
 *     summary: Get my submissions
 *     description: Retrieves the list of submissions made by the authenticated user.
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-submissions",
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SubmissionController.getMySubmissions)
);

/**
 * @swagger
 * /run/{submissionId}:
 *   post:
 *     summary: Run a submission
 *     description: Runs a specific submission by its ID.
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: submissionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission to run
 *     responses:
 *       200:
 *         description: Submission run successfully
 *       404:
 *         description: Submission not found
 */
router.post(
  "/run/:submissionId",
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SubmissionController.runSubmission)
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all submissions
 *     description: Retrieves a list of all submissions (admin access only).
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array

 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/', // Get all Submissions
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(SubmissionController.getAllSubmissions)
);

/**
 * @swagger
 * /{submissionId}:
 *   get:
 *     summary: Get submission by ID
 *     description: Retrieves a submission by its ID (admin access only).
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: submissionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission
 *     responses:
 *       200:
 *         description: Submission data
 *         content:
 *           application/json:
 *              schema:
 *                type: object
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  "/:submissionId", // Get submission by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(SubmissionController.getSingleSubmission)
);

/**
 * @swagger
 * /{submissionId}:
 *   patch:
 *     summary: Update submission by ID
 *     description: Updates a submission by its ID (admin access only).
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: submissionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               totalCost:
 *                 type: integer
 *               tasks:
 *                 type: array
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       403:
 *         description: Forbidden (not an admin)
 */
router.patch(
  "/:submissionId", // Update submission by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(SubmissionController.updateSubmission)
);

/**
 * @swagger
 * /{submissionId}:
 *   delete:
 *     summary: Delete submission by ID
 *     description: Deletes a submission by ID (admin access only).
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: submissionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission to delete
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       403:
 *         description: Forbidden (not an admin)
 */
router.delete(
  "/:submissionId", // Delete submission by id
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireAdmin,
  asyncErrorHandler(SubmissionController.deleteSubmission)
);

module.exports = router;
