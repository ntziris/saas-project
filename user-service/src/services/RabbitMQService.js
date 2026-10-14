const amqp = require('amqplib');
const User = require('../models/UserModel');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmqadmin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'saas24_06_rabbitmq_password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URI = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const TRANSACTIONS_EXCHANGE = process.env.TRANSACTIONS_EXCHANGE || 'TRANSACTIONS_EXCHANGE';
const USERS_EXCHANGE = process.env.USERS_EXCHANGE || 'USERS_EXCHANGE';
const USER_TRANSACTIONS_QUEUE = process.env.USER_TRANSACTIONS_QUEUE || 'USER_TRANSACTIONS_QUEUE';

class RabbitMQService {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async init() {
    // Establish connection to RabbitMQ server
    this.connection = await amqp.connect(RABBITMQ_URI);
    this.channel = await this.connection.createChannel();

    // Assert the fanout exchanges
    await this.channel.assertExchange(TRANSACTIONS_EXCHANGE, 'fanout', {
      durable: true,
    });
    await this.channel.assertExchange(USERS_EXCHANGE, 'fanout', {
      durable: true,
    });

    // Declare the queue for transactions
    const { queue } = await this.channel.assertQueue(USER_TRANSACTIONS_QUEUE, {
      exclusive: true,
    });

    // Bind the queue to the exchange
    await this.channel.bindQueue(queue, TRANSACTIONS_EXCHANGE, '');

    // Start listening for messages
    this.listenForTransactionDoneEvents(queue);
  }

  async listenForTransactionDoneEvents(queue) {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          await this.updateUserCredits(content);

          // Acknowledge the processed message
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error consuming message from RabbitMQ:', error);
    }
  }

  async updateUserCredits(content) {
    try {
      const { userId, creditsPurchased } = content;
      const user = await User.findById(userId);
      if (user) {
        user.credits += creditsPurchased;
        await user.save();
        // console.log(`Updated credits for user ${userId}: +${creditsPurchased}`);
      } else {
        console.error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('Error updating user credits:', error);
    }
  }

  async publishUserCreatedEvent(user) {
    try {
      const message = JSON.stringify({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role ? user.role.name : null,
        createdAt: user.createdAt,
      });

      this.channel.publish(USERS_EXCHANGE, '', Buffer.from(message));
      console.log('User created event published to RabbitMQ');
    } catch (error) {
      console.error('Error publishing user created event:', error);
    }
  }
}

module.exports = new RabbitMQService();
