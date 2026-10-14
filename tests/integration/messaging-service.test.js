const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const USER_BASE_URL = 'http://localhost/api/user';
const TRANSACTION_BASE_URL = 'http://localhost/api/transaction';
let userToken, adminToken, userId, transactionId;

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
  userId = userResponse.data.userId;
});

// Cleanup: Delete test user and transaction after all tests
afterAll(async () => {
  if (userId) {
    // Delete test user
    try {
      await axios.delete(`${USER_BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error(`Failed to delete test user ${userId}:`, error.message);
    }

    // Delete test transaction
    try {
      await axios.delete(`${TRANSACTION_BASE_URL}/${transactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error(`Failed to delete test transaction ${transactionId}:`, error.message);
    }
  }
});

describe('Messaging Service API Integration Tests', () => {
  // Test for making a new transaction (requires user authentication)
  test('User makes a transaction', async () => {
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

  // Test to see if credits have been added
  test('Get User Status and check if credits are updated', async () => {
    const response = await axios.get(`${USER_BASE_URL}/status`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('credits', 1000);
  });
});
