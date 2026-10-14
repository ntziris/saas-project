const amqp = require('amqplib');
const ResultController = require('../controllers/ResultController');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmqadmin';
const RABBITMQ_PASS =
  process.env.RABBITMQ_PASS || 'saas24_06_rabbitmq_password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URI = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const RESULTS_EXCHANGE = 'RESULTS_EXCHANGE';
const RESULT_RESULTS_QUEUE = 'RESULT_RESULTS_QUEUE';

class RabbitMQService {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async init() {
    // Establish connection to RabbitMQ server
    this.connection = await amqp.connect(RABBITMQ_URI);
    this.channel = await this.connection.createChannel();

    // Assert the fanout exchange
    await this.channel.assertExchange(RESULTS_EXCHANGE, 'fanout', {
      durable: true,
    });

    // Declare the queue for results
    const { queue } = await this.channel.assertQueue(RESULT_RESULTS_QUEUE, {
      exclusive: true,
    });

    // Bind the queue to the exchange
    await this.channel.bindQueue(queue, RESULTS_EXCHANGE, '');

    // Start listening for messages
    this.listenForResultEvents(queue);
  }

  async listenForResultEvents(queue) {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());

          await this.createResult(content);

          // Acknowledge the processed message
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error consuming message from RabbitMQ:', error);
    }
  }

  async createResult(content) {
    try {
      const { solution, extra, executionTime } =
        content;
      const resultData = {
        submissionId: extra.submissionId,
        taskId: extra.taskId,
        userId: extra.userId,
        output: JSON.stringify(solution),
        executionTime,
      };
      await ResultController.createResult(resultData);
      // console.log(`Created result for submission ${submissionId}`);
    } catch (error) {
      console.error('Error creating result:', error);
    }
  }
}

module.exports = new RabbitMQService();
