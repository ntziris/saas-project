const amqp = require('amqplib');
const SubmissionModel = require('../models/SubmissionModel');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmqadmin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'saas24_06_rabbitmq_password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URI = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || 'storage-service';
const STORAGE_PORT = process.env.STORAGE_PORT || '9000';
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY || 'saas24_06_storage_access_key';
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY || 'saas24_06_storage_secret_key'

const STORAGE_URL = `http://${STORAGE_ENDPOINT}:${STORAGE_PORT}`

const SUBMISSIONS_EXCHANGE = process.env.SUBMISSIONS_EXCHANGE || 'SUBMISSIONS_EXCHANGE';
const RESULTS_EXCHANGE = process.env.RESULTS_EXCHANGE || 'RESULTS_EXCHANGE';
const SUBMISSION_RESULTS_QUEUE = process.env.SUBMISSION_RESULTS_QUEUE || 'SUBMISSION_RESULTS_QUEUE';

class RabbitMQService {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async init() {
    // Establish connection to RabbitMQ server
    this.connection = await amqp.connect(RABBITMQ_URI);
    this.channel = await this.connection.createChannel();

    // Declare the fanout exchanges
    await this.channel.assertExchange(SUBMISSIONS_EXCHANGE, 'fanout', { durable: true });
    await this.channel.assertExchange(RESULTS_EXCHANGE, 'fanout', { durable: true });

    // Declare the SUBMISSION_RESULTS_QUEUE
    await this.channel.assertQueue(SUBMISSION_RESULTS_QUEUE, { durable: true });

    // Bind the SUBMISSION_RESULTS_QUEUE to the RESULTS_EXCHANGE
    await this.channel.bindQueue(SUBMISSION_RESULTS_QUEUE, RESULTS_EXCHANGE, '');

    // Set up consumer for the SUBMISSION_RESULTS_QUEUE
    await this.consumeResults();
  }

  async publishTaskCreatedEvent(task, submissionId, userId, solverModelId) {
    if (!this.channel) {
      await this.init();
    }

    const message = {
      DestinationInformation: {
        Host: RABBITMQ_HOST,
        Port: RABBITMQ_PORT,
        Type: 'RabbitMQ',
        Exchange: RESULTS_EXCHANGE,
        Credentials: {
          Name: RABBITMQ_USER,
          Pass: RABBITMQ_PASS,
        },
        Extra: {
          userId: userId,
          submissionId: submissionId,
          taskId: task._id.toString(),
        },
      },
      DatabaseFiles: {
        URL: STORAGE_URL,
        BucketName: `user-${userId}`,
        InputDataFile: `${solverModelId}/inputData/${task.inputDataFileName}`,
        MetadataFile: `${solverModelId}/metadata/${task.metadataFileName}`,
        Credentials: {
          AccessKey: STORAGE_ACCESS_KEY,
          SecretKey: STORAGE_SECRET_KEY,
        },
      },
    };

    // Publish to the exchange
    this.channel.publish(SUBMISSIONS_EXCHANGE, '', Buffer.from(JSON.stringify(message)), {
      persistent: true, // Messages will persist even if RabbitMQ server restarts
    });
  }

  async consumeResults() {
    await this.channel.consume(SUBMISSION_RESULTS_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.processResult(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Nack the message with requeue set to false to discard it
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  async processResult(result) {
    const { taskId, submissionId } = result.extra;

    if (!taskId || !submissionId) {
      console.error('Invalid result: missing taskId or submissionId', result);
      return;
    }

    try {
      // Update the task status to 'done'
      const updateResult = await SubmissionModel.updateOne(
        { 'tasks._id': taskId },
        { $set: { 'tasks.$.status': 'done' } }
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(`No task found with id ${taskId}`);
        return;
      }

      // Check if all tasks for the submission are done
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
        console.warn(`No submission found with id ${submissionId}`);
        return;
      }

      const allTasksDone = submission.tasks.every((task) => task.status === 'done');

      if (allTasksDone) {
        // Update the submission status to 'done'
        await SubmissionModel.findByIdAndUpdate(submissionId, { status: 'done' });
        console.log(`Submission ${submissionId} completed`);
      }
    } catch (error) {
      console.error('Error processing result:', error);
    }
  }
}

module.exports = new RabbitMQService();
