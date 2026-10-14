const express = require('express');
const mongoose = require('mongoose');
const MinIOService = require('./services/MinIOService');
const { initDatabase } = require('./scripts/initDatabase');
const SolverModelRoutes = require('./routes/SolverModelRoutes');
const errorHandler = require('./middlewares/ErrorHandlerMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs  = require('./swaggerConfig');
const cors = require('cors');

const PORT = process.env.PORT || 3004;
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solver_model_service';

async function startServer() {
  // Connect to MongoDB
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to Database (MongoDB) successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // Initialize Database
  try {
    await initDatabase();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  // Check MinIO connection
  try {
    await MinIOService.checkConnection();
    console.log('Connected to Storage Service (MinIO) successfully');
  } catch (error) {
    console.error('Failed to connect to MinIO:', error);
    process.exit(1);
  }

  // Start Express Server
  try {
    const app = express();
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs ));
    
    app.use(cors({
      origin: [`http://localhost:${PORT}`,'http://localhost:3000'], 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true, 
    }));

    app.use(express.json());

    // Routes
    app.use('', SolverModelRoutes);

    // Error handling middleware
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`SolverModel service is running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);

    });
  } catch (error) {
    console.error('Failed to start Express server:', error);
    process.exit(1);
  }
}

startServer();
