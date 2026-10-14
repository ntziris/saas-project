const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const USER_BASE_URL = 'http://localhost/api/user';
const SUBMISSION_BASE_URL = 'http://localhost/api/submission';
const SOLVER_MODEL_BASE_URL = 'http://localhost/api/solver/all-solver-models';
let userToken, adminToken, userId, submissionId, solverModelId;

// Utility functions
const generateUniqueEmail = () => `test-${uuidv4()}@example.com`;
const generateUniquePassword = () => `pass-${uuidv4().slice(0, 8)}`;
const generateUniqueName = () => `Test User ${uuidv4().slice(0, 6)}`;

// Setup: Sign in as admin, create a test user, and get a solver model before tests
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

  // Get all solver models and use the first one
  const solverModelsResponse = await axios.get(`${SOLVER_MODEL_BASE_URL}/`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (solverModelsResponse.data.solverModels.length > 0) {
    solverModelId = solverModelsResponse.data.solverModels[0]._id;
  } else {
    throw new Error('No solver models found. Please ensure at least one solver model exists in the database.');
  }
});

// Cleanup: Delete test user after all tests
afterAll(async () => {
  if (userId) {
    try {
      await axios.delete(`${USER_BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error(`Failed to delete test user ${userId}:`, error.message);
    }
  }
});

describe('Submission Service API Integration Tests', () => {
  // Test for creating a new submission
  test('Customer creates a submission', async () => {
    const submissionData = {
      name: 'Test Submission',
      totalCost: 100,
      solverModelId: solverModelId,
      tasks: [{
        metadataFileName: 'safsdafsadfsafsafasd.json',
        inputDataFileName: 'dfsdafsdafasfasd.json'
      }]
    };
    
    const response = await axios.post(
      `${SUBMISSION_BASE_URL}/`,
      submissionData,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('message', 'Submission created successfully');
    expect(response.data).toHaveProperty('submissionId');

    submissionId = response.data.submissionId;
  });

  // Test for getting user's submissions
  test('Get Customer Submissions', async () => {
    const response = await axios.get(`${SUBMISSION_BASE_URL}/my-submissions`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0]).toHaveProperty('submissionId');
    expect(response.data[0]).toHaveProperty('name');
    expect(response.data[0]).toHaveProperty('totalCost');
    expect(response.data[0]).toHaveProperty('status');
    expect(response.data[0]).toHaveProperty('creatorId');
    expect(response.data[0]).toHaveProperty('solverModelId');
    expect(response.data[0]).toHaveProperty('tasks');
  });

  // Test for running a submission
  test('Run a Submission', async () => {
    const response = await axios.post(
      `${SUBMISSION_BASE_URL}/run/${submissionId}`,
      {},
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Submission running started');
    expect(response.data.submission).toHaveProperty('status', 'Running');
  });

  // Test for getting all submissions (admin only)
  test('Get all submissions', async () => {
    const response = await axios.get(`${SUBMISSION_BASE_URL}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0]).toHaveProperty('submissionId');
    expect(response.data[0]).toHaveProperty('name');
    expect(response.data[0]).toHaveProperty('totalCost');
    expect(response.data[0]).toHaveProperty('status');
    expect(response.data[0]).toHaveProperty('creatorId');
    expect(response.data[0]).toHaveProperty('solverModelId');
    expect(response.data[0]).toHaveProperty('tasks');
  });

  // Test for getting a single submission
  test('Get Single Submission', async () => {
    const response = await axios.get(`${SUBMISSION_BASE_URL}/${submissionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('submissionId', submissionId);
    expect(response.data).toHaveProperty('name', 'Test Submission');
    expect(response.data).toHaveProperty('totalCost', 100);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('creatorId');
    expect(response.data).toHaveProperty('solverModelId', solverModelId);
    expect(response.data).toHaveProperty('tasks');
    expect(Array.isArray(response.data.tasks)).toBe(true);
  });

  // Test for updating a submission
  test('Update Submission', async () => {
    const updateData = {
      name: 'Updated Submission Name',
      totalCost: 150,
      tasks: [{
        metadataFileName: "metadata.json",
        inputDataFileName: "inputData.json"
      }]
    };

    const response = await axios.patch(
      `${SUBMISSION_BASE_URL}/${submissionId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Submission updated successfully');
    expect(response.data).toHaveProperty('submission');
    expect(response.data.submission).toHaveProperty('name', 'Updated Submission Name');
    expect(response.data.submission).toHaveProperty('totalCost', 150);
    expect(response.data.submission).toHaveProperty('status', 'Ready');
    expect(response.data.submission.tasks).toHaveLength(1);
    expect(response.data.submission.tasks[0]).toHaveProperty('status', 'Ready');
    expect(response.data.submission.tasks[0]).toHaveProperty('metadataFileName', "metadata.json");
    expect(response.data.submission.tasks[0]).toHaveProperty('inputDataFileName', "inputData.json");
  });

  // Test for deleting a submission
  test('Delete Submission', async () => {
    const response = await axios.delete(`${SUBMISSION_BASE_URL}/${submissionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Submission deleted successfully');
  });

  // Test for getting a deleted submission (should fail)
  test('Try to Get Deleted Submission', async () => {
    try {
      await axios.get(`${SUBMISSION_BASE_URL}/${submissionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'Submission not found');
    }
  });
});