const express = require('express');
const router = express.Router();
const multer = require('multer');
const SolverModelController = require('../controllers/SolverModelController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const upload = multer({ storage: multer.memoryStorage() });
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
 * /upload:
 *   post:
 *     summary: Upload a solver model file
 *     description: Uploads a solver model file along with file type and solver model ID for the authenticated user.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               fileType:
 *                 type: string
 *                 description: The type of the file (e.g., "metadata", "inputData")
 *                 example: model
 *               solverModelId:
 *                 type: string
 *                 description: The ID of the solver model the file is associated with
 *                 example: 66f6c39917d7b87c2c5ac9f3
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request
 */
router.post(
  '/upload',
  AuthMiddleware.authenticateToken,
  upload.single('file'),
  asyncErrorHandler(SolverModelController.uploadFile)
);

/**
 * @swagger
 * /download/{solverModelId}/{fileId}:
 *   get:
 *     summary: Download a solver model file
 *     description: Downloads a file for a specific solver model by its file ID.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solverModelId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the solver model
 *         example: 66f6c39917d7b87c2c5ac9f3
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the file to download
 *         example: 5f8d0d55b54764421b7156b2
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File not found
 */

router.get(
  '/download/:solverModelId/:fileId',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SolverModelController.getFile)
);

/**
 * @swagger
 * /my-files/{modelId}:
 *   get:
 *     summary: Get my solver model files
 *     description: Retrieves all files for a specific solver model for the authenticated user.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: modelId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the solver model
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileId:
 *                     type: string
 *                   fileName:
 *                     type: string
 *                   uploadDate:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Files not found
 */
router.get(
  '/my-files/:modelId',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SolverModelController.getMyFiles)
);

/**
 * @swagger
 * /all-solver-models:
 *   get:
 *     summary: Get all solver models
 *     description: Retrieves a list of all solver models.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of solver models
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   solverModelId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  '/all-solver-models',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SolverModelController.getAllSolverModels)
);

/**
 * @swagger
 * /upload:
 *   put:
 *     summary: Update a solver model file
 *     description: Updates an existing solver model file for the authenticated user by replacing it with a new file.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               solverModelId:
 *                 type: string
 *                 description: The ID of the solver model
 *                 example: 66f6c39917d7b87c2c5ac9f3
 *               fileId:
 *                 type: string
 *                 description: The ID of the file to be updated
 *                 example: 5f8d0d55b54764421b7156b2
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The new file to replace the old one
 *     responses:
 *       200:
 *         description: File updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File updated successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request
 */

router.put(
  '/upload',
  AuthMiddleware.authenticateToken,
  upload.single('file'),
  asyncErrorHandler(SolverModelController.updateFile)
);

/**
 * @swagger
 * /{solverModelId}/{fileId}:
 *   delete:
 *     summary: Delete a solver model file
 *     description: Deletes a file for a specific solver model by its file ID.
 *     tags: [SolverModel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solverModelId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the solver model
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete(
  '/:solverModelId/:fileId',
  AuthMiddleware.authenticateToken,
  asyncErrorHandler(SolverModelController.deleteFile)
);

module.exports = router;
