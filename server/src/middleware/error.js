export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

// Turns known database and request errors into client errors instead of generic 500s.
function normalizeError(error) {
  if (error.statusCode) return error;

  if (error.type === 'entity.parse.failed') {
    return Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 });
  }

  if (error.name === 'CastError') {
    return Object.assign(new Error(`Invalid value for ${error.path}`), { statusCode: 400 });
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors || {}).map((item) => item.message).join(', ') || 'Invalid data';
    return Object.assign(new Error(message), { statusCode: 400 });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0];
    const message = field ? `A record with this ${field} already exists` : 'Duplicate record';
    return Object.assign(new Error(message), { statusCode: 409 });
  }

  return error;
}

export function errorHandler(error, req, res, next) {
  const normalized = normalizeError(error);
  const statusCode = normalized.statusCode || error.status || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : normalized.message
  });
}
