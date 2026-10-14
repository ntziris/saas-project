const Result = require('../models/ResultModel');
const CustomError = require('../utils/CustomError');

// Helper function to format result data
const formatResultResponse = (result) => {
  return {
    resultId: result._id.toString(),
    submissionId: result.submissionId,
    output: result.output,
    executionTime: result.executionTime,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
};

exports.getResultsBySubmissionId = async (req, res) => {
  const { submissionId } = req.params;
  const userId = req.user.userId; // Get the userId from the authenticated user

  const results = await Result.find({ submissionId, userId });

  if (results.length === 0) {
    throw new CustomError('No results found for this submission', 404);
  }

  const formattedResults = results.map(formatResultResponse);
  res.status(200).json(formattedResults);
};

exports.createResult = async (resultData) => {
  const result = new Result(resultData);
  await result.save();
  return formatResultResponse(result);
};

exports.getAllResults = async (req, res) => {
  const results = await Result.find({});
  const formattedResults = results.map(formatResultResponse);
  res.status(200).json(formattedResults);
};