const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');

async function createUser(email, password, name, role = 'user') {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      email,
      passwordHash,
      name,
      role: { name: role },
      credits: 0,
    });

    await newUser.save();
    console.log(`User ${name} with role ${role} created successfully`);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function initDatabase() {
  // Create initial admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'saas24_06';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  await createUser(adminEmail, adminPassword, adminName, 'admin');

  // Create test user
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';
  const testName = process.env.TEST_USER_NAME || 'Test User';
  await createUser(testEmail, testPassword, testName, 'user');
}

module.exports = { initDatabase, createUser };
