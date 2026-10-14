const SolverModel = require('../models/SolverModel');
const CustomError = require('../utils/CustomError');
const MinIOService = require('../services/MinIOService');
const Ajv = require('ajv');

const ajv = new Ajv();

const validateJsonFile = async (file, solverModel, fileType) => {
  try {
    const jsonContent = JSON.parse(file.buffer.toString());

    let schema;
    if (fileType === 'metadata') {
      schema = JSON.parse(solverModel.metadataTemplate);
    } else if (fileType === 'inputData') {
      schema = JSON.parse(solverModel.inputDataTemplate);
    }

    const validate = ajv.compile(schema);
    const valid = validate(jsonContent);

    if (!valid) {
      throw new CustomError(`Invalid ${fileType} JSON: ${ajv.errorsText(validate.errors)}`, 400);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CustomError('Invalid JSON format', 400);
    }
    throw error;
  }
};

const ensureBucketExists = async (bucketName) => {
  const bucketExists = await MinIOService.bucketExists(bucketName);
  if (!bucketExists) {
    await MinIOService.createBucket(bucketName);
  }
};

exports.uploadFile = async (req, res) => {
  const { fileType, solverModelId } = req.body;
  const file = req.file;

  // Get the userId from the authenticated user (jwt) in the request
  const userId = req.user.userId;

  if (!file) {
    throw new CustomError('No file uploaded', 400);
  }

  if (!fileType || !solverModelId) {
    throw new CustomError('fileType and solverModelId are required in the request body', 400);
  }

  if (!['metadata', 'inputData'].includes(fileType)) {
    throw new CustomError('Invalid file type', 400);
  }

  // Check if the solverModel exists
  const solverModel = await SolverModel.findById(solverModelId);
  if (!solverModel) {
    throw new CustomError('Solver model not found', 404);
  }

  // Parse and validate the JSON file
  await validateJsonFile(file, solverModel, fileType);

  const bucketName = `user-${userId}`;
  const objectKey = `${solverModelId}/${fileType}/${file.originalname}`;

  // Ensure the bucket exists (create if it doesn't)
  await ensureBucketExists(bucketName);

  // Check if a file with the same name already exists
  const fileExists = await MinIOService.objectExists(bucketName, objectKey);
  if (fileExists) {
    throw new CustomError(
      `A file with the name '${file.originalname}' already exists for this solver model and file type`,
      409
    );
  }

  // Upload the file
  await MinIOService.uploadToMinIO(bucketName, objectKey, file.buffer);

  const fileInfo = {
    filename: file.originalname,
    type: fileType,
    bucketName,
    objectKey,
  };

  // Add the new file to the solverModel's files array
  solverModel.files.push(fileInfo);

  // Save the updated solverModel
  await solverModel.save();

  // Get the _id of the newly added file
  const addedFile = solverModel.files[solverModel.files.length - 1];

  res.status(200).json({
    message: 'File uploaded successfully and solver model updated',
    file: {
      ...fileInfo,
      fileId: addedFile._id,
    },
  });
};

exports.getFile = async (req, res) => {
  const { solverModelId, fileId } = req.params;
  const userId = req.user.userId;

  // Find the solverModel and the specific file
  const solverModel = await SolverModel.findById(solverModelId);
  if (!solverModel) {
    throw new CustomError('Solver model not found', 404);
  }

  const fileInfo = solverModel.files.id(fileId);
  if (!fileInfo) {
    throw new CustomError('File not found in solver model', 404);
  }

  // Check if the file belongs to the user
  if (!fileInfo.bucketName.startsWith(`user-${userId}`)) {
    throw new CustomError('Unauthorized access to file', 403);
  }

  const fileBuffer = await MinIOService.getFileFromMinIO(fileInfo.bucketName, fileInfo.objectKey);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
  res.send(fileBuffer);
};

exports.getMyFiles = async (req, res) => {
  const { modelId } = req.params;
  const userId = req.user.userId;

  // Find the solverModel
  const solverModel = await SolverModel.findById(modelId);
  if (!solverModel) {
    throw new CustomError('Solver model not found', 404);
  }

  // Filter files for the current user
  const userFiles = solverModel.files.filter((file) => file.bucketName === `user-${userId}`);

  // Separate metadata and inputData files
  const metadataFiles = userFiles
    .filter((file) => file.type === 'metadata')
    .map((file) => ({
      fileId: file._id,
      filename: file.filename,
      type: file.type,
      uploadedAt: file._id.getTimestamp(),
    }));

  const inputDataFiles = userFiles
    .filter((file) => file.type === 'inputData')
    .map((file) => ({
      fileId: file._id,
      filename: file.filename,
      type: file.type,
      uploadedAt: file._id.getTimestamp(),
    }));

  res.status(200).json({
    modelId: modelId,
    metadataFiles,
    inputDataFiles,
  });
};

exports.getAllSolverModels = async (req, res) => {
  // Fetch all solver models from the database, excluding the 'files' field
  const solverModels = await SolverModel.find({}, '-files');

  res.status(200).json({
    message: 'All solver models retrieved successfully',
    solverModels: solverModels,
  });
};

// Updated method for updating files (replacing them with new ones)
exports.updateFile = async (req, res) => {
  const { solverModelId, fileId } = req.body;
  const file = req.file;
  const userId = req.user.userId;

  if (!file) {
    throw new CustomError('No file uploaded', 400);
  }

  if (!solverModelId || !fileId) {
    throw new CustomError('solverModelId and fileId are required in the request body', 400);
  }

  // Find the solverModel and the specific file
  const solverModel = await SolverModel.findById(solverModelId);
  if (!solverModel) {
    throw new CustomError('Solver model not found', 404);
  }

  const fileInfo = solverModel.files.id(fileId);
  if (!fileInfo) {
    throw new CustomError('File not found in solver model', 404);
  }

  // Check if the file belongs to the user
  if (!fileInfo.bucketName.startsWith(`user-${userId}`)) {
    throw new CustomError('Unauthorized access to file', 403);
  }

  // Parse and validate the new JSON file
  await validateJsonFile(file, solverModel, fileInfo.type);

  // Delete the old file from MinIO
  await MinIOService.deleteFromMinIO(fileInfo.bucketName, fileInfo.objectKey);

  // Update the objectKey with the new filename
  fileInfo.objectKey = `${solverModelId}/${fileInfo.type}/${file.originalname}`;

  // Upload the new file to MinIO
  await MinIOService.uploadToMinIO(fileInfo.bucketName, fileInfo.objectKey, file.buffer);

  // Update the file information in the solverModel
  fileInfo.filename = file.originalname;

  // Save the updated solverModel
  await solverModel.save();

  res.status(200).json({
    message: 'File updated successfully',
    file: {
      fileId: fileInfo._id,
      filename: fileInfo.filename,
      type: fileInfo.type,
      uploadedAt: fileInfo._id.getTimestamp(),
    },
  });
};

// New method for deleting files
exports.deleteFile = async (req, res) => {
  const { solverModelId, fileId } = req.params;
  const userId = req.user.userId;

  // Find the solverModel and the specific file
  const solverModel = await SolverModel.findById(solverModelId);
  if (!solverModel) {
    throw new CustomError('Solver model not found', 404);
  }

  const fileInfo = solverModel.files.id(fileId);
  if (!fileInfo) {
    throw new CustomError('File not found in solver model', 404);
  }

  // Check if the file belongs to the user
  if (!fileInfo.bucketName.startsWith(`user-${userId}`)) {
    throw new CustomError('Unauthorized access to file', 403);
  }

  // Delete the file from MinIO
  await MinIOService.deleteFromMinIO(fileInfo.bucketName, fileInfo.objectKey);

  // Remove the file from the solverModel's files array
  solverModel.files.pull(fileId);

  // Save the updated solverModel
  await solverModel.save();

  res.status(200).json({
    message: 'File deleted successfully',
    deletedFile: {
      fileId: fileInfo._id,
      filename: fileInfo.filename,
      type: fileInfo.type,
    },
  });
};
