const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost/api/user';
let userToken, adminToken, userId;

// Utility functions
const generateUniqueEmail = () => `test-${uuidv4()}@example.com`;
const generateUniquePassword = () => `pass-${uuidv4().slice(0, 8)}`;
const generateUniqueName = () => `Test User ${uuidv4().slice(0, 6)}`;

// Setup: Sign in as admin and create a test user before tests
beforeAll(async () => {
  const adminResponse = await axios.post(`${BASE_URL}/signin`, {
    email: 'admin@example.com',
    password: 'your_admin_password',
  });
  adminToken = adminResponse.data.token;

  const userData = {
    email: generateUniqueEmail(),
    password: generateUniquePassword(),
    name: generateUniqueName(),
  };

  const userResponse = await axios.post(`${BASE_URL}/signup`, userData);
  userToken = userResponse.data.token;
  userId = userResponse.data.userId;
});

// Cleanup: Delete test user after all tests
afterAll(async () => {
  if (userId) {
    try {
      await axios.delete(`${BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error(`Failed to delete test user ${userId}:`, error.message);
    }
  }
});

describe('Auth Service API Integration Tests', () => {
  // Test for unauthorized access
  test('Unauthorized Access', async () => {
    try {
      await axios.get(`${BASE_URL}/`);
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  // Test for accessing user route with user token (should be allowed)
  test('User Accessing User Route', async () => {
    const response = await axios.get(`${BASE_URL}/status`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
  });

  // Test for accessing user route with admin token (should be allowed)
  test('Admin Accessing User Route', async () => {
    const response = await axios.get(`${BASE_URL}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
  });

  // Test for accessing admin route with user token (should NOT be allowed)
  test('User Accessing Admin Route', async () => {
    try {
      await axios.get(`${BASE_URL}/`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  // Test for accessing admin route with admin token (should be allowed)
  test('Admin Accessing Admin Route', async () => {
    const response = await axios.get(`${BASE_URL}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
