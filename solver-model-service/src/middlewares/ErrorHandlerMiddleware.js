const CustomError = require('../utils/CustomError');

const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  res.status(statusCode).json(response);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join('. ');
  const message = `Invalid input data: ${errorMessages}`;

  return new CustomError(message, 400);
};

const handleCastError = (err) => {
  const msg = `Invalid value ${err.value}`;
  return new CustomError(msg, 400);
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorResponse(res, err.statusCode, err.message, {
      stackTrace: err.stack,
      error: err,
    });
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.name === 'ValidationError') err = handleValidationError(err);

    if (err.isOperational) {
      sendErrorResponse(res, err.statusCode, err.message);
    } else {
      console.error('Error:', err);
      sendErrorResponse(res, 500, 'Something went wrong! Please try again later.');
    }
  }
};

module.exports = errorHandler;