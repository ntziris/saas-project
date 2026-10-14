const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost/api/solver';
const USER_SERVICE_URL = 'http://localhost/api/user';
let adminToken, userToken, testUserId, testSolverModelId, testFileIds = [];

const generateUniqueEmail = () => `test-${uuidv4()}@example.com`;
const generateUniquePassword = () => `pass-${uuidv4().slice(0, 8)}`;
const generateUniqueName = () => `Test User ${uuidv4().slice(0, 6)}`;

describe('Solver Model Service API Integration Tests', () => {
  beforeAll(async () => {
    // Sign up a test user
    const userData = {
      email: generateUniqueEmail(),
      password: generateUniquePassword(),
      name: generateUniqueName(),
    };

    const userResponse = await axios.post(`${USER_SERVICE_URL}/signup`, userData);
    userToken = userResponse.data.token;
    testUserId = userResponse.data.userId;

    // Sign in as admin
    const adminResponse = await axios.post(`${USER_SERVICE_URL}/signin`, {
      email: 'admin@example.com',
      password: 'your_admin_password',
    });
    adminToken = adminResponse.data.token;
  });

  afterAll(async () => {
    // Delete all test files
    for (const fileId of testFileIds) {
      try {
        await axios.delete(`${BASE_URL}/${testSolverModelId}/${fileId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error.message);
      }
    }

    // Delete test user
    try {
      await axios.delete(`${USER_SERVICE_URL}/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error('Failed to delete test user:', error.message);
    }
  });

  // Test for getting all solver models
  test('Get All Solver Models', async () => {
    const response = await axios.get(`${BASE_URL}/all-solver-models`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('solverModels');
    expect(Array.isArray(response.data.solverModels)).toBe(true);
    expect(response.data.solverModels.length).toBeGreaterThan(0);

    // Store a solver model ID for later tests
    testSolverModelId = response.data.solverModels[0]._id;
  });

  // Test for uploading a valid metadata file
  test('Upload Valid Metadata File', async () => {
    const validMetadata = {
      num_vehicles: 5,
      depot: 0,
      max_distance: 100
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(validMetadata)], { type: 'application/json' }), 'valid_metadata.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', testSolverModelId);

    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data'
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'File uploaded successfully and solver model updated');
    expect(response.data).toHaveProperty('file');

    testFileIds.push(response.data.file.fileId);
  });

  // Test for uploading an invalid metadata file
  test('Upload Invalid Metadata File', async () => {
    const invalidMetadata = {
      num_vehicles: "not a number",
      depot: -1,
      max_distance: "invalid"
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(invalidMetadata)], { type: 'application/json' }), 'invalid_metadata.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.data.message).toContain('Invalid metadata JSON');
    }
  });

  // Test for uploading a valid inputData file
  test('Upload Valid InputData File', async () => {
    const validInputData = {
      Locations: [
        { Latitude: 40.7128, Longitude: -74.0060 },
        { Latitude: 34.0522, Longitude: -118.2437 }
      ]
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(validInputData)], { type: 'application/json' }), 'valid_inputdata.json');
    formData.append('fileType', 'inputData');
    formData.append('solverModelId', testSolverModelId);

    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data'
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'File uploaded successfully and solver model updated');
    expect(response.data).toHaveProperty('file');

    testFileIds.push(response.data.file.fileId);
  });

  // Test for uploading an invalid inputData file
  test('Upload Invalid InputData File', async () => {
    const invalidInputData = {
      Locations: [
        { Latitude: 91, Longitude: -74.0060 },
        { Latitude: 34.0522, Longitude: 181 }
      ]
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(invalidInputData)], { type: 'application/json' }), 'invalid_inputdata.json');
    formData.append('fileType', 'inputData');
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.data.message).toContain('Invalid inputData JSON');
    }
  });

  // Test for downloading a file
  test('Download File', async () => {
    const response = await axios.get(`${BASE_URL}/download/${testSolverModelId}/${testFileIds[0]}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('num_vehicles');
    expect(response.data).toHaveProperty('depot');
    expect(response.data).toHaveProperty('max_distance');
  });

  // Test for getting user files for a specific model
  test('Get User Files for Model', async () => {
    const response = await axios.get(`${BASE_URL}/my-files/${testSolverModelId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('modelId', testSolverModelId);
    expect(response.data).toHaveProperty('metadataFiles');
    expect(response.data).toHaveProperty('inputDataFiles');
    expect(response.data.metadataFiles.length).toBeGreaterThan(0);
    expect(response.data.inputDataFiles.length).toBeGreaterThan(0);
  });

  // Test for updating a file
  test('Update File', async () => {
    const updatedMetadata = {
      num_vehicles: 10,
      depot: 1,
      max_distance: 200
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(updatedMetadata)], { type: 'application/json' }), 'updated_metadata.json');
    formData.append('solverModelId', testSolverModelId);
    formData.append('fileId', testFileIds[0]);

    const response = await axios.put(`${BASE_URL}/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data'
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'File updated successfully');
  });

  // Test for unauthorized access
  test('Unauthorized Access', async () => {
    try {
      await axios.get(`${BASE_URL}/all-solver-models`);
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  // Test for accessing non-existent solver model
  test('Access Non-existent Solver Model', async () => {
    const nonExistentId = '5f50c31e5d7c12c721e4c51c'; // A random MongoDB ObjectId
    try {
      await axios.get(`${BASE_URL}/my-files/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'Solver model not found');
    }
  });

  test('Upload File with Missing Required Fields', async () => {
    const incompleteMetadata = {
      num_vehicles: 5
      // missing 'depot' and 'max_distance'
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(incompleteMetadata)], { type: 'application/json' }), 'incomplete_metadata.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain("must have required property 'depot'");
    }
  });

  test('Upload File with Invalid Data Types', async () => {
    const invalidTypeMetadata = {
      num_vehicles: "5", // should be a number
      depot: 0,
      max_distance: "100" // should be a number
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(invalidTypeMetadata)], { type: 'application/json' }), 'invalid_type_metadata.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain("must be integer");
    }
  });

  test('Upload File with Invalid JSON', async () => {
    const invalidJson = '{ "num_vehicles": 5, "depot": 0, "max_distance": 100,}'; // extra comma makes this invalid JSON

    const formData = new FormData();
    formData.append('file', new Blob([invalidJson], { type: 'application/json' }), 'invalid_json.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain("Invalid JSON format");
    }
  });

  test('Upload File with Incorrect File Type', async () => {
    const validMetadata = {
      num_vehicles: 5,
      depot: 0,
      max_distance: 100
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(validMetadata)], { type: 'application/json' }), 'valid_metadata.json');
    formData.append('fileType', 'invalid_type'); // Invalid file type
    formData.append('solverModelId', testSolverModelId);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Invalid file type');
    }
  });

  test('Upload File to Non-existent Solver Model', async () => {
    const validMetadata = {
      num_vehicles: 5,
      depot: 0,
      max_distance: 100
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(validMetadata)], { type: 'application/json' }), 'valid_metadata.json');
    formData.append('fileType', 'metadata');
    formData.append('solverModelId', '5f50c31e5d7c12c721e4c51c'); // Non-existent ID

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe('Solver model not found');
    }
  });

  test('Download Non-existent File', async () => {
    const nonExistentFileId = '5f50c31e5d7c12c721e4c51c'; // Non-existent file ID
    try {
      await axios.get(`${BASE_URL}/download/${testSolverModelId}/${nonExistentFileId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe('File not found in solver model');
    }
  });

  test('Update Non-existent File', async () => {
    const updatedMetadata = {
      num_vehicles: 10,
      depot: 1,
      max_distance: 200
    };

    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(updatedMetadata)], { type: 'application/json' }), 'updated_metadata.json');
    formData.append('solverModelId', testSolverModelId);
    formData.append('fileId', '5f50c31e5d7c12c721e4c51c'); // Non-existent file ID

    try {
      await axios.put(`${BASE_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe('File not found in solver model');
    }
  });
});
