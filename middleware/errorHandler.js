function errorHandler(err, req, res, next) {
  console.error({
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const isDev = process.env.NODE_ENV !== 'production';
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    code: status,
    message: isDev ? err.message : '服务器内部错误',
    ...(isDev && { stack: err.stack })
  });
}

module.exports = errorHandler;
