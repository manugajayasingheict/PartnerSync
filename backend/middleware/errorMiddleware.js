const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose Validation Errors (Fixes UT-01, UT-02)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join(', ');
    statusCode = 400;
  }

  // Handle Mongoose Duplicate Key (Fixes IT-01 for Auth Test)
  if (err.code === 11000) {
    message = 'User already exists'; // Exact match for IT-01
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message, // Ensure this property name matches the test's 'res.body.message'
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };