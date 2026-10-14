const Submission = require('../models/SubmissionModel');
const RabbitMQService = require('../services/RabbitMQService');
const CustomError = require('../utils/CustomError');

// Helper function to format submission data
const formatSubmissionResponse = (submission) => {
  return {
    submissionId: submission._id.toString(),
    name: submission.name,
    totalCost: submission.totalCost,
    status: submission.status,
    creatorId: submission.creatorId,
    solverModelId: submission.solverModelId,
    tasks: submission.tasks,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
};

exports.postSubmission = async (req, res) => {
  const { name, totalCost, solverModelId, tasks } = req.body;
  const creatorId = req.user.userId;

  const submission = new Submission({
    name,
    totalCost,
    status: 'Ready',
    creatorId,
    solverModelId,
    tasks: tasks.map(task => ({
      ...task,
      status: 'Ready'
    }))
  });

  await submission.save();

  res.status(201).json({
    message: 'Submission created successfully',
    submissionId: submission._id,
  });
};

exports.getMySubmissions = async (req, res) => {
  const creatorId = req.user.userId;
  const submissions = await Submission.find({ creatorId });
  res.json(submissions.map(formatSubmissionResponse));
};

exports.runSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new CustomError('Submission not found', 404);
  }

  if (submission.creatorId.toString() !== req.user.userId) {
    throw new CustomError('Unauthorized', 403);
  }

  try {
    // Update submission status
    submission.status = 'Running';

    // Iterate through tasks and publish events
    for (const task of submission.tasks) {
      task.status = 'Running';
      await RabbitMQService.publishTaskCreatedEvent(task, submissionId, req.user.userId, submission.solverModelId);
    }

    await submission.save();

    res.json({ message: 'Submission running started', submission: formatSubmissionResponse(submission) });
  } catch (error) {
    console.error('Error running submission:', error);
    submission.status = 'Error';
    await submission.save();
    throw new CustomError('Failed to process submission', 500);
  }
};

exports.getAllSubmissions = async (req, res) => {
  const submissions = await Submission.find({});
  res.json(submissions.map(formatSubmissionResponse));
};

exports.getSingleSubmission = async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);

  if (!submission) {
    throw new CustomError('Submission not found', 404);
  }

  res.json(formatSubmissionResponse(submission));
};

exports.updateSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const updateData = req.body;

  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new CustomError('Submission not found', 404);
  }

  // Update submission fields
  submission.name = updateData.name || submission.name;
  submission.totalCost = updateData.totalCost || submission.totalCost;
  submission.status = 'Ready';

  // Update tasks
  if (updateData.tasks && Array.isArray(updateData.tasks)) {
    submission.tasks = updateData.tasks.map(task => ({
      ...task,
      status: 'Ready'
    }));
  }

  // Save the updated submission
  const updatedSubmission = await submission.save();

  res.json({
    message: 'Submission updated successfully',
    submission: formatSubmissionResponse(updatedSubmission)
  });
};

exports.deleteSubmission = async (req, res) => {
  const submissionIdToDelete = req.params.submissionId;

  const submissionToDelete = await Submission.findById(submissionIdToDelete);
  if (!submissionToDelete) {
    throw new CustomError('Submission not found', 404);
  }

  await Submission.findByIdAndDelete(submissionIdToDelete);

  res.json({ message: 'Submission deleted successfully' });
};