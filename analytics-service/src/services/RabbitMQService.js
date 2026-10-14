const amqp = require('amqplib');
const RedisService = require('./RedisService');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmqadmin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'saas24_06_rabbitmq_password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URI = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const TRANSACTIONS_EXCHANGE = "TRANSACTIONS_EXCHANGE";
const USERS_EXCHANGE = "USERS_EXCHANGE";
const SUBMISSIONS_EXCHANGE = "SUBMISSIONS_EXCHANGE";
const RESULTS_EXCHANGE = "RESULTS_EXCHANGE";

class RabbitMQService {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async init() {
    // Establish connection to RabbitMQ server
    this.connection = await amqp.connect(RABBITMQ_URI);
    this.channel = await this.connection.createChannel();

    // Setup exchanges and queues
    await this.setupExchangeAndQueue(TRANSACTIONS_EXCHANGE, 'ANALYTICS_TRANSACTIONS_QUEUE');
    await this.setupExchangeAndQueue(USERS_EXCHANGE, 'ANALYTICS_USERS_QUEUE');
    await this.setupExchangeAndQueue(SUBMISSIONS_EXCHANGE, 'ANALYTICS_SUBMISSIONS_QUEUE');
    await this.setupExchangeAndQueue(RESULTS_EXCHANGE, 'ANALYTICS_RESULTS_QUEUE');
  }

  async setupExchangeAndQueue(exchange, queueName) {
    // Assert the fanout exchange
    await this.channel.assertExchange(exchange, 'fanout', { durable: true });

    // Declare the queue
    const { queue } = await this.channel.assertQueue(queueName, { exclusive: true });

    // Bind the queue to the exchange
    await this.channel.bindQueue(queue, exchange, '');

    // Start listening for messages
    this.listenForEvents(queue);
  }

  async listenForEvents(queue) {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          await this.handleEvent(content, queue);

          // Acknowledge the processed message
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error consuming message from RabbitMQ:', error);
    }
  }

  async handleEvent(content, queue) {
    try {
      switch (queue) {
        case 'ANALYTICS_TRANSACTIONS_QUEUE':
          await this.incrementTransactionCounter();
          break;
        case 'ANALYTICS_USERS_QUEUE':
          await this.incrementUserCounter();
          break;
        case 'ANALYTICS_SUBMISSIONS_QUEUE':
          await this.incrementSubmissionCounter();
          break;
        case 'ANALYTICS_RESULTS_QUEUE':
          await this.incrementResultCounter();
          break;
        default:
          console.warn(`Unknown queue: ${queue}`);
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  async incrementUserCounter() {
    await RedisService.increment('users_count');
  }

  async incrementTransactionCounter() {
    await RedisService.increment('transactions_count');
  }

  async incrementSubmissionCounter() {
    await RedisService.increment('submissions_count');
  }

  async incrementResultCounter() {
    await RedisService.increment('results_count');
  }
}

module.exports = new RabbitMQService();
