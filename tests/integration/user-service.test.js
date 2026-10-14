const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost/api/user';
let adminToken, userToken, userId, userEmail, userPass;

const generateUniqueEmail = () => `test-${uuidv4()}@example.com`;
const generateUniquePassword = () => `pass-${uuidv4().slice(0, 8)}`;
const generateUniqueName = () => `Test User ${uuidv4().slice(0, 6)}`;

describe('User Service API Integration Tests', () => {
  // Test for user signup
  test('User Signup', async () => {
    const userData = {
      email: generateUniqueEmail(),
      password: generateUniquePassword(),
      name: generateUniqueName(),
    };

    const response = await axios.post(`${BASE_URL}/signup`, userData);

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('message', 'User created successfully');
    expect(response.data).toHaveProperty('token');
    expect(response.data).toHaveProperty('userId');

    userToken = response.data.token;
    userId = response.data.userId;
    userEmail = userData.email;
    userPass = userData.password;
  });

  // Test for user signup but user already exists
  test('User tries Signup but the user already exists', async () => {
    const userData = {
      email: userEmail,
      password: generateUniquePassword(),
      name: generateUniqueName(),
    };

    try {
      await axios.post(`${BASE_URL}/signup`, userData);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message', 'User already exists');
    }
  });

  // Test for user signup but with not a valid email
  test('User tries to Signup but with not a valid email', async () => {
    const userData = {
      email: 'notValidEmail',
      password: generateUniquePassword(),
      name: generateUniqueName(),
    };

    try {
      await axios.post(`${BASE_URL}/signup`, userData);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty(
        'message',
        'Invalid input data: notvalidemail is not a valid email format'
      );
    }
  });

  // Test for user signup but with not a valid name
  test('User tries Signup but with not a valid name', async () => {
    const userData = {
      email: generateUniqueEmail(),
      password: generateUniquePassword(),
      name: 'a',
    };

    try {
      const response = await axios.post(`${BASE_URL}/signup`, userData);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty(
        'message',
        'Invalid input data: Name must be at least 2 characters long'
      );
    }
  });

  // Test for user signup but with not a valid password lenght
  test('User tries Signup but with not a valid password lenght', async () => {
    const userData = {
      email: generateUniqueEmail(),
      password: '12345',
      name: generateUniqueName(),
    };

    try {
      await axios.post(`${BASE_URL}/signup`, userData);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty(
        'message',
        'Invalid input data: Password must be at least 6 characters long'
      );
    }
  });

  // Test for user signin
  test('User Signin', async () => {
    const userData = {
      email: userEmail,
      password: userPass,
    };

    const response = await axios.post(`${BASE_URL}/signin`, userData);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Signed in successfully');
    expect(response.data).toHaveProperty('token');
    expect(response.data).toHaveProperty('is_admin', false);
  });

  // Test for invalid credentials
  test('Sign In With Invalid Credentials', async () => {
    try {
      await axios.post(`${BASE_URL}/signin`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
    }
  });

  // Test for wrong email
  test('Sign In With Invalid Email', async () => {
    try {
      await axios.post(`${BASE_URL}/signin`, {
        email: 'nonexistent@example.com',
        password: userPass,
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
    }
  });

  // Test for invalid password
  test('Sign In With Invalid Password', async () => {
    try {
      await axios.post(`${BASE_URL}/signin`, {
        email: userEmail,
        password: 'wrongpassword',
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
    }
  });

  // Test for admin signin
  test('Admin Signin', async () => {
    const response = await axios.post(`${BASE_URL}/signin`, {
      email: 'admin@example.com',
      password: 'your_admin_password',
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'Signed in successfully');
    expect(response.data).toHaveProperty('token');
    expect(response.data).toHaveProperty('is_admin', true);

    adminToken = response.data.token;
  });

  // Test for getting user status (requires user authentication)
  test('Get User Status', async () => {
    const response = await axios.get(`${BASE_URL}/status`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('userId', userId);
    expect(response.data).toHaveProperty('email', userEmail);
    expect(response.data).toHaveProperty('name');
    expect(response.data).toHaveProperty('role', 'user');
    expect(response.data).toHaveProperty('credits', 0);
    expect(response.data).not.toHaveProperty('password'); // Ensure sensitive information is not returned
  });

  // Test for getting all users (requires admin authentication)
  test('Get All Users', async () => {
    const response = await axios.get(`${BASE_URL}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(1);
  });

  // Test for getting user by ID (requires admin authentication)
  test('Get User by ID', async () => {
    const response = await axios.get(`${BASE_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('userId', userId);
    expect(response.data).toHaveProperty('email', userEmail);
    expect(response.data).toHaveProperty('name');
    expect(response.data).toHaveProperty('role', 'user');
    expect(response.data).toHaveProperty('credits', 0);
    expect(response.data).not.toHaveProperty('password'); // Ensure sensitive information is not returned
  });

  // Test for getting user by ID, but the user dosen't exist (requires admin authentication)
  test('Try to Get User by Wrong ID', async () => {
    try {
      await axios.get(`${BASE_URL}/66cb2a16966c300409985f0b`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'User not found');
    }
  });

  // Test for getting user by ID, but the user dosen't exist (requires admin authentication)
  test('Try to Get User by Invalid ID', async () => {
    try {
      await axios.get(`${BASE_URL}/invalid_id`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message', 'Invalid value invalid_id');
    }
  });

  // Test for deleting a user (requires admin authentication)
  test('Delete User', async () => {
    const response = await axios.delete(`${BASE_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'User deleted successfully');
  });

  // Test for deleting a user that dosen't exist
  test("Try to Delete a user that doesn't exist", async () => {
    try {
      await axios.delete(`${BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message', 'User not found');
    }
  });

  // Test for deleted user tries to signin
  test('Deleted User Tries To Signin', async () => {
    try {
      await axios.post(`${BASE_URL}/signin`, {
        email: userEmail,
        password: userPass,
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
    }
  });
});
