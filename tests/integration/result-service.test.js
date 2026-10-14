const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const USER_BASE_URL = 'http://localhost/api/user';
const RESULT_BASE_URL = 'http://localhost/api/result';
const SUBMISSION_BASE_URL = 'http://localhost/api/submission';
const SOLVER_MODEL_BASE_URL = 'http://localhost/api/solver/all-solver-models';

let userToken, adminToken, submissionId, solverModelId;

// Setup: Sign in as admin and test user, get a solver model, create a submission, and run it before tests
beforeAll(async () => {
  // Sign in as admin
  const adminResponse = await axios.post(`${USER_BASE_URL}/signin`, {
    email: 'admin@example.com',
    password: 'your_admin_password',
  });
  adminToken = adminResponse.data.token;

  // Sign in as test user
  const userResponse = await axios.post(`${USER_BASE_URL}/signin`, {
    email: 'test@example.com',
    password: 'testpassword',
  });
  userToken = userResponse.data.token;

  // Get all solver models and use the first one
  const solverModelsResponse = await axios.get(`${SOLVER_MODEL_BASE_URL}/`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (solverModelsResponse.data.solverModels.length > 0) {
    solverModelId = solverModelsResponse.data.solverModels[0]._id;
  } else {
    throw new Error('No solver models found. Please ensure at least one solver model exists in the database.');
  }

  // Get the submissionId from the /my-submissions route
  const mySubmissionsResponse = await axios.get(
    `${SUBMISSION_BASE_URL}/my-submissions`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );

  if (mySubmissionsResponse.data.length > 0) {
    submissionId = mySubmissionsResponse.data[0].submissionId;
  } else {
    throw new Error('No submissions found for the user.');
  }
});

describe('Result Service API Integration Tests', () => {
  test('Get results by submissionId', async () => {
    // Poll for results (in a real scenario, you might want to implement a more sophisticated waiting mechanism)
    let result;
    for (let i = 0; i < 10; i++) {
      const response = await axios.get(`${RESULT_BASE_URL}/${submissionId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (response.data && response.data.status === 'completed') {
        result = response.data;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next poll
    }

    expect(result).toBeDefined();
    expect(result).toHaveProperty('submissionId', submissionId);
    expect(result).toHaveProperty('status', 'completed');
    expect(result).toHaveProperty('result');
    expect(result.result).toHaveProperty('routes');
    expect(result.result).toHaveProperty('totalDistance');
  });

  test('Get all results (admin only)', async () => {
    const response = await axios.get(`${RESULT_BASE_URL}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0]).toHaveProperty('submissionId');
    expect(response.data[0]).toHaveProperty('status');
    expect(response.data[0]).toHaveProperty('result');
  });
});
