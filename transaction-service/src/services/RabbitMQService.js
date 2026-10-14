const amqp = require('amqplib');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmqadmin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'saas24_06_rabbitmq_password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URI = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
const TRANSACTIONS_EXCHANGE = process.env.TRANSACTIONS_EXCHANGE || 'TRANSACTIONS_EXCHANGE';

class RabbitMQService {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async init() {
    // Establish connection to RabbitMQ server
    this.connection = await amqp.connect(RABBITMQ_URI);
    this.channel = await this.connection.createChannel();

    // Declare the fanout exchange
    await this.channel.assertExchange(TRANSACTIONS_EXCHANGE, 'fanout', { durable: true });
  }

  async publishTransactionDoneEvent(transaction) {
    if (!this.channel) {
      await this.init();
    }
    const message = {
      userId: transaction.customerId,
      creditsPurchased: transaction.creditsPurchased,
      transactionId: transaction._id.toString(),
    };

    // Publish to the exchange
    this.channel.publish(TRANSACTIONS_EXCHANGE, '', Buffer.from(JSON.stringify(message)), {
      persistent: true, // Messages will persist even if RabbitMQ server restarts
    });
  }
}

module.exports = new RabbitMQService();
