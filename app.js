const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./config/db');

const v1Router = require('./routes/v1');
const appRouter = require('./app/index');
const authRouter = require('./routes/auth');

const app = express();

// CORS
app.use(cors());

// 日志
app.use(logger('dev'));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/v1', v1Router);
app.use('/api/auth', authRouter);
app.use('/app', appRouter);

// 404
app.use((_req, _res, next) => {
  next(createError(404));
});

// 全局错误处理
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';

  // 非 404 错误打印日志
  if (status >= 500) {
    console.error('[Error]', err);
  }

  // API 请求返回 JSON
  if (req.path.startsWith('/api/v1') || req.path.startsWith('/app') || req.headers['content-type']?.includes('application/json')) {
    return res.status(status).json({ code: status, message });
  }

  res.locals.message = message;
  res.locals.error = app.get('env') === 'development' ? err : {};
  res.status(status);
  res.render('error');
});

module.exports = app;
