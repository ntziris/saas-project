const Transaction = require('../models/TransactionModel');
const RabbitMQService = require('../services/RabbitMQService');
const CustomError = require('../utils/CustomError');

// Helper function to format transaction data
const formatTransactionResponse = (transaction) => {
  const response = {
    transactionId: transaction._id.toString(),
    customerId: transaction.customerId,
    transactionCost: transaction.transactionCost,
    creditsPurchased: transaction.creditsPurchased,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
  return response;
};

exports.getAllTransactions = async (req, res) => {
  const transactions = await Transaction.find({});
  res.json(transactions.map(formatTransactionResponse));
};

exports.postTransaction = async (req, res) => {
  // Get the customer id from the authenticated user in the request
  const customerId = req.user.userId;

  const transaction = new Transaction({
    customerId: customerId,
    transactionCost: req.body.transactionCost,
    creditsPurchased: req.body.creditsPurchased,
  });

  await transaction.save();

  await RabbitMQService.publishTransactionDoneEvent(transaction);

  res.status(201).json({
    message: 'Transaction created successfully',
    transactionId: transaction._id,
  });
};

exports.getSingleTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.transactionId);

  if (!transaction) {
    throw new CustomError('Transaction not found', 404);
  }

  res.json(formatTransactionResponse(transaction));
};

exports.deleteTransaction = async (req, res) => {
  const transactionIdToDelete = req.params.transactionId;

  // Check if transaction to be deleted exists
  const transactionToDelete = await Transaction.findById(transactionIdToDelete);
  if (!transactionToDelete) {
    throw new CustomError('Transaction not found', 404);
  }

  // Delete the transaction
  await Transaction.findByIdAndDelete(transactionIdToDelete);

  res.json({ message: 'Transaction deleted successfully' });
};

exports.getCustomerTransactions = async (req, res) => {
  const customerId = req.params.customerId;

  // Find all transactions for this customer
  const transactions = await Transaction.find({ customerId });

  res.json(transactions.map(formatTransactionResponse));
};

exports.getMyTransactions = async (req, res) => {
  // Get the customer id from the authenticated user in the request
  const customerId = req.user.userId;

  // Find all transactions for this customer
  const transactions = await Transaction.find({ customerId });

  res.json(transactions.map(formatTransactionResponse));
};
