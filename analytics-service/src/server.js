const express = require('express');
const RabbitMQService = require('./services/RabbitMQService');
const RedisService = require('./services/RedisService');
const AnalyticsRoutes = require('./routes/AnalyticsRoutes');
const errorHandler = require('./middlewares/ErrorHandlerMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs  = require('./swaggerConfig');
const cors = require('cors');

const PORT = process.env.PORT || 3006;

async function startServer() {
  // Initialize Redis
  try {
    await RedisService.connect();
    console.log('Redis Service initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Continue with server startup even if Redis fails
  }

  // Initialize RabbitMQ
  try {
    await RabbitMQService.init();
    console.log('RabbitMQ Service initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    // Continue with server startup even if RabbitMQ fails
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
    app.use('', AnalyticsRoutes);

    // Error handling middleware
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Analytics service is running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);

    });
  } catch (error) {
    console.error('Failed to start Express server:', error);
    process.exit(1);
  }
}

startServer();
