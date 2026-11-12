import multer from 'multer';

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  // Handle Multer upload limits
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size limit exceeded. Maximum file size allowed is 15MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload received.',
    });
  }

  console.error('[UNHANDLED SERVER ERROR]:', err);

  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
