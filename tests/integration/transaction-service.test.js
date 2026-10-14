const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const USER_BASE_URL = 'http://localhost/api/user';
const TRANSACTION_BASE_URL = 'http://localhost/api/transaction';
let userToken, adminToken, customerId, transactionId;

// Utility functions
const generateUniqueEmail = () => `test-${uuidv4()}@example.com`;
const generateUniquePassword = () => `pass-${uuidv4().slice(0, 8)}`;
const generateUniqueName = () => `Test User ${uuidv4().slice(0, 6)}`;

// Setup: Sign in as admin and create a test user before tests
beforeAll(async () => {
  const adminResponse = await axios.post(`${USER_BASE_URL}/signin`, {
    email: 'admin@example.com',
    password: 'your_admin_password',
  });
  adminToken = adminResponse.data.token;

  const userData = {
    email: generateUniqueEmail(),
    password: generateUniquePassword(),
    name: generateUniqueName(),
  };

  const userResponse = await axios.post(`${USER_BASE_URL}/signup`, userData);
  userToken = userResponse.data.token;
  customerId = userResponse.data.userId;
});

// Cleanup: Delete test customer after all tests
afterAll(async () => {
  if (customerId) {
    try {
      await axios.delete(`${USER_BASE_URL}/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error(`Failed to delete test customer ${customerId}:`, error.message);
    }
  }
});

describe('Transaction Service API Integration Tests', () => {
  // Test for making a new transaction (requires user authentication)
  test('Customer makes a transaction', async () => {
    const response = await axios.post(
      `${TRANSACTION_BASE_URL}/`,
      {
        transactionCost: 100,
        creditsPurchased: 1000,
      },
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('message', 'Transaction created successfully');
    expect(response.data).toHaveProperty('transactionId');

    transactionId = response.data.transactionId;
  });

  // Test for making a new transaction (requires user authentication)
  test('Customer tries to makes a transaction with invalid transactionCost', async () => {
    try {
      const response = await axios.post(
        `${TRANSACTION_BASE_URL}/`,
        {
          transactionCost: 0.001,
          creditsPurchased: 1000,
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty(
        'message',
        'Invalid input data: 0.001 is not a valid transaction cost. It must be at least 0.01'
      );
    }
  });

  // Test for getting user's transactions (requires user authentication)
  test('Get Customer Transactions', async () => {
    const response = await axios.get(`${TRANSACTION_BASE_URL}/my-transactions`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });

  // Test for getting all transactions (requires admin authentication)
  test('Get all transactions', async () => {
    const response = await axios.get(`${TRANSACTION_BASE_URL}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });

  // Test for getting customer's transaction by customerId (requires admin authentication)
  test('Get Customer Transactions by customerId', async () => {
    const response = await axios.get(`${TRANSACTION_BASE_URL}/customer/${customerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });

  // Test for getting customer's transaction by invalid Customer (requires admin authentication)
  test('Try to Get Customer Transactions by invalid customerId', async () => {
    try {
      const response = await axios.get(`${TRANSACTION_BASE_URL}/customer/invalid_id`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty(
        'message',
        'Invalid value invalid_id'
      );
    }
  });

  // Test for getting transaction by ID (requires admin authentication)
  test('Get Transaction by ID', async () => {
    const response = await axios.get(`${TRANSACTION_BASE_URL}/${transactionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('transactionId', transactionId);
    expect(response.data).toHaveProperty('customerId', customerId);
    expect(response.data).toHaveProperty('transactionCost', 100);
    expect(response.data).toHaveProperty('creditsPurchased', 1000);
  });

  // Test for getting transaction by wrong ID (requires admin authentication)
  test('Try to Get Transaction by Wrong ID', async () => {
    try {
      await axios.get(`${TRANSACTION_BASE_URL}/66cb2a16966c300409985f0b`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'Transaction not found');
    }
  });

  // Test for deleting a transaction (requires admin authentication)
  test('Delete Transaction', async () => {
    const response = await axios.delete(`${TRANSACTION_BASE_URL}/${transactionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Transaction deleted successfully');
  });

  // Test for deleting a transaction that doesn't exist (requires admin authentication)
  test("Try To Delete Transaction That Doesn't exist", async () => {
    try {
      const response = await axios.delete(`${TRANSACTION_BASE_URL}/${transactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'Transaction not found');
    }
  });
});
