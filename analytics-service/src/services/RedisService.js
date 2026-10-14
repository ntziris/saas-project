const redis = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';

REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`

class RedisService {
  constructor() {
    this.client = redis.createClient({
      url: REDIS_URL
    });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async increment(key) {
    return await this.client.incr(key);
  }

  async get(key) {
    return await this.client.get(key);
  }
}

module.exports = new RedisService();