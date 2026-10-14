const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

const USER_BASE_URL = 'http://localhost/api/user';
const SUBMISSION_BASE_URL = 'http://localhost/api/submission';
const SOLVER_MODEL_BASE_URL = 'http://localhost/api/solver';

let userToken, adminToken, solverModelId;

// Setup: Sign in as admin and test user, and get a solver model before tests
beforeAll(async () => {
  try {
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
    const solverModelsResponse = await axios.get(`${SOLVER_MODEL_BASE_URL}/all-solver-models`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (solverModelsResponse.data.solverModels.length > 0) {
      solverModelId = solverModelsResponse.data.solverModels[0]._id;
    } else {
      throw new Error('No solver models found. Please ensure at least one solver model exists in the database.');
    }

    // Upload metadata file
    const metadataContent = await fs.readFile(path.join(__dirname, '..', 'metadata_test.json'), 'utf8');
    const metadataFormData = new FormData();
    metadataFormData.append('file', Buffer.from(metadataContent), {
      filename: 'metadata_test.json',
      contentType: 'application/json',
    });
    metadataFormData.append('fileType', 'metadata');
    metadataFormData.append('solverModelId', solverModelId);

    await axios.post(`${SOLVER_MODEL_BASE_URL}/upload`, metadataFormData, {
      headers: { 
        ...metadataFormData.getHeaders(),
        Authorization: `Bearer ${userToken}`,
      }
    });

    // Upload input data file
    const inputDataContent = await fs.readFile(path.join(__dirname, '..', 'locations_20.json'), 'utf8');
    const inputDataFormData = new FormData();
    inputDataFormData.append('file', Buffer.from(inputDataContent), {
      filename: 'locations_20.json',
      contentType: 'application/json',
    });
    inputDataFormData.append('fileType', 'inputData');
    inputDataFormData.append('solverModelId', solverModelId);

    await axios.post(`${SOLVER_MODEL_BASE_URL}/upload`, inputDataFormData, {
      headers: { 
        ...inputDataFormData.getHeaders(),
        Authorization: `Bearer ${userToken}`,
      }
    });

    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error during setup:', error.message);
    throw error;
  }
});

describe('Submission Creation and Running Tests', () => {
  let submissionId;

  test('Create a submission', async () => {
    const submissionData = {
      name: 'Test Submission for Result Service',
      totalCost: 100,
      solverModelId: solverModelId,
      tasks: [{
        metadataFileName: 'metadata_test.json',
        inputDataFileName: 'locations_20.json'
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

  test('Run the submission', async () => {
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
});