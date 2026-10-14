const CustomError = require('../utils/CustomError');
const RedisService = require('../services/RedisService');

exports.getAnalytics = async (req, res) => {
    try {
        const usersCount = await RedisService.get('users_count') || 0;
        const transactionsCount = await RedisService.get('transactions_count') || 0;
        const submissionsCount = await RedisService.get('submissions_count') || 0;
        const resultsCount = await RedisService.get('results_count') || 0;

        res.json({
            users: parseInt(usersCount),
            transactions: parseInt(transactionsCount),
            submissions: parseInt(submissionsCount),
            results: parseInt(resultsCount)
        });
    } catch (error) {
        throw new CustomError('Error retrieving analytics', 500);
    }
};

exports.getUsersCount = async (req, res) => {
    try {
        const count = await RedisService.get('users_count') || 0;
        res.json({ users: parseInt(count) });
    } catch (error) {
        throw new CustomError('Error retrieving users count', 500);
    }
};

exports.getTransactionsCount = async (req, res) => {
    try {
        const count = await RedisService.get('transactions_count') || 0;
        res.json({ transactions: parseInt(count) });
    } catch (error) {
        throw new CustomError('Error retrieving transactions count', 500);
    }
};

exports.getSubmissionsCount = async (req, res) => {
    try {
        const count = await RedisService.get('submissions_count') || 0;
        res.json({ submissions: parseInt(count) });
    } catch (error) {
        throw new CustomError('Error retrieving submissions count', 500);
    }
};

exports.getResultsCount = async (req, res) => {
    try {
        const count = await RedisService.get('results_count') || 0;
        res.json({ results: parseInt(count) });
    } catch (error) {
        throw new CustomError('Error retrieving results count', 500);
    }
};
