const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.STORAGE_ENDPOINT || 'storage-service',
  port: parseInt(process.env.STORAGE_PORT || '9000'),
  useSSL: process.env.STORAGE_USE_SSL === 'true',
  accessKey: process.env.STORAGE_ACCESS_KEY || 'saas24_06_storage_access_key',
  secretKey: process.env.STORAGE_SECRET_KEY || 'saas24_06_storage_secret_key',
});

exports.checkConnection = () => {
  return new Promise((resolve, reject) => {
    minioClient.listBuckets((err, buckets) => {
      if (err) return reject(err);
      resolve(buckets);
    });
  });
};

exports.uploadToMinIO = async (bucketName, objectKey, buffer) => {
  return new Promise((resolve, reject) => {
    minioClient.putObject(bucketName, objectKey, buffer, (err, etag) => {
      if (err) {
        return reject(err);
      }
      resolve(etag);
    });
  });
};

exports.getFileFromMinIO = async (bucketName, objectKey) => {
  return new Promise((resolve, reject) => {
    minioClient.getObject(bucketName, objectKey, (err, dataStream) => {
      if (err) {
        return reject(err);
      }

      let data = [];
      dataStream.on('data', (chunk) => data.push(chunk));
      dataStream.on('end', () => resolve(Buffer.concat(data)));
      dataStream.on('error', (err) => reject(err));
    });
  });
};

exports.bucketExists = async (bucketName) => {
  return new Promise((resolve, reject) => {
    minioClient.bucketExists(bucketName, (err, exists) => {
      if (err) {
        return reject(err);
      }
      resolve(exists);
    });
  });
};

exports.objectExists = async (bucketName, objectName) => {
  return new Promise((resolve, reject) => {
    minioClient.statObject(bucketName, objectName, (err, stat) => {
      if (err) {
        if (err.code === 'NotFound') {
          resolve(false);
        } else {
          reject(err);
        }
      } else {
        resolve(true);
      }
    });
  });
};

exports.createBucket = async (bucketName) => {
  return new Promise((resolve, reject) => {
    minioClient.makeBucket(bucketName, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

exports.deleteFromMinIO = async (bucketName, objectKey) => {
  return new Promise((resolve, reject) => {
    minioClient.removeObject(bucketName, objectKey, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
