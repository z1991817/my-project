const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./config/env');
require('./config/db');

const v1Router = require('./routes/v1');
const appRouter = require('./app/index');
const authRouter = require('./routes/auth');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS 配置
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS 不允许来自 ${origin} 的请求`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 日志
app.use(logger('dev'));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 设置请求超时时间为10分钟（600秒）
// 适配图片生成等长耗时操作
app.use((req, res, next) => {
  req.setTimeout(600000); // 请求超时：10分钟
  res.setTimeout(600000); // 响应超时：10分钟
  next();
});

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 速率限制
app.use('/api', globalLimiter);
app.use('/app', globalLimiter);

// 路由
app.use('/api/v1', v1Router);
app.use('/api/auth', authRouter);
app.use('/app', appRouter);

// 404
app.use((_req, _res, next) => {
  next(createError(404));
});

// 全局错误处理
app.use(errorHandler);

module.exports = app;
